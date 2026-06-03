//! URL protocol filtering — port of `Drupal\Component\Utility\UrlHelper`.
//!
//! [`strip_dangerous_protocols`] iteratively removes any scheme not in the
//! allow-list (`javascript:`, `vbscript:`, `data:` evasions, …), exactly
//! mirroring the PHP `do { } while ($before != $uri)` loop. [`filter_bad_protocol`]
//! is the full attribute-value pipeline: decode entities → strip protocols →
//! HTML-escape.

use crate::entities::{decode_entities, escape};

/// Drupal's `UrlHelper::$allowedProtocols` default plus the extended set the
/// core test harness installs. The XSS surface only ever *adds* schemes here,
/// so a generous default keeps benign links intact while still neutralizing the
/// dangerous ones (`javascript`, `vbscript`, `data`, …) which are never listed.
pub const DEFAULT_ALLOWED_PROTOCOLS: &[&str] = &[
    "http", "https", "ftp", "news", "nntp", "telnet", "mailto", "irc", "ssh",
    "sftp", "webcal", "rtsp",
];

/// Returns true if `protocol` (already lowercased) is in `allowed`.
fn is_allowed(protocol: &str, allowed: &[&str]) -> bool {
    allowed.contains(&protocol)
}

/// Strips dangerous protocols from a plain-text URI.
///
/// Port of `UrlHelper::stripDangerousProtocols()`:
/// - Find the first `:`. If it is preceded by `/`, `?` or `#`, the colon cannot
///   be a scheme separator (relative URL) — stop.
/// - If the scheme before the colon is not allow-listed, drop everything up to
///   and including the colon, then repeat (defeats `java\0script:` /
///   `jav&#x09;ascript:` style layering once entities/nulls are gone).
pub fn strip_dangerous_protocols(uri: &str, allowed: &[&str]) -> String {
    let mut uri = uri.to_string();
    loop {
        let before = uri.clone();
        if let Some(colon) = uri.find(':') {
            // PHP `strpos(...) > 0`: a leading colon (position 0) is ignored.
            if colon > 0 {
                let protocol = &uri[..colon];
                // A `/`, `?` or `#` before the colon => relative URL, safe.
                if protocol.contains('/') || protocol.contains('?') || protocol.contains('#') {
                    break;
                }
                if !is_allowed(&protocol.to_ascii_lowercase(), allowed) {
                    uri = uri[colon + 1..].to_string();
                }
            }
        }
        if before == uri {
            break;
        }
    }
    uri
}

/// Full attribute-value sanitizer: `UrlHelper::filterBadProtocol()`.
///
/// `decodeEntities` → `stripDangerousProtocols` → `escape`. The decode step is
/// what unmasks entity-encoded `javascript:` payloads before the scheme check,
/// and the final escape re-neutralizes any markup characters in the value.
pub fn filter_bad_protocol(value: &str, allowed: &[&str]) -> String {
    let decoded = decode_entities(value);
    let stripped = strip_dangerous_protocols(&decoded, allowed);
    escape(&stripped)
}

#[cfg(test)]
mod tests {
    use super::*;

    const ALLOWED: &[&str] = DEFAULT_ALLOWED_PROTOCOLS;

    #[test]
    fn strips_javascript_scheme() {
        assert_eq!(strip_dangerous_protocols("javascript:alert(0)", ALLOWED), "alert(0)");
    }

    #[test]
    fn strips_case_insensitively() {
        assert_eq!(strip_dangerous_protocols("jaVaSCriPt:x", ALLOWED), "x");
        assert_eq!(strip_dangerous_protocols("VBScript:x", ALLOWED), "x");
    }

    #[test]
    fn keeps_allowed_scheme() {
        assert_eq!(
            strip_dangerous_protocols("http://www.example.com/", ALLOWED),
            "http://www.example.com/"
        );
        assert_eq!(
            strip_dangerous_protocols("mailto:a@b.com", ALLOWED),
            "mailto:a@b.com"
        );
    }

    #[test]
    fn relative_url_with_slash_before_colon_is_kept() {
        // Colon after a slash cannot be a scheme.
        assert_eq!(
            strip_dangerous_protocols("/path:to/x", ALLOWED),
            "/path:to/x"
        );
        assert_eq!(strip_dangerous_protocols("//www.example.com/.a", ALLOWED), "//www.example.com/.a");
    }

    #[test]
    fn iteratively_strips_layered_schemes() {
        // After one strip the remainder still leads with a bad scheme.
        assert_eq!(
            strip_dangerous_protocols("javascript:vbscript:alert(0)", ALLOWED),
            "alert(0)"
        );
    }

    #[test]
    fn unknown_scheme_stripped() {
        assert_eq!(strip_dangerous_protocols("nosuchscheme:notice(0)", ALLOWED), "notice(0)");
        assert_eq!(strip_dangerous_protocols("data:text/html,x", ALLOWED), "text/html,x");
    }

    #[test]
    fn filter_bad_protocol_decodes_then_strips_then_escapes() {
        // Entity-encoded javascript: must be neutralized.
        let enc = "&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(0)";
        let out = filter_bad_protocol(enc, ALLOWED);
        assert!(!out.to_lowercase().contains("javascript:"), "got: {out}");
        assert_eq!(out, "alert(0)");
    }

    #[test]
    fn filter_bad_protocol_escapes_markup() {
        assert_eq!(filter_bad_protocol("http://x/?a=\"b\"", ALLOWED), "http://x/?a=&quot;b&quot;");
    }
}
