//! HTML entity decoding and escaping.
//!
//! Ports the two `Drupal\Component\Utility\Html` helpers that `Xss`/`UrlHelper`
//! depend on:
//!
//! * [`decode_entities`] ≈ `html_entity_decode($text, ENT_QUOTES, 'UTF-8')` —
//!   decodes numeric (decimal + hex, with arbitrary leading zeros) and named
//!   entities to their UTF-8 bytes. This is what lets the protocol filter see
//!   through `&#106;avascript:` / `&#x6A;avascript:` evasions.
//! * [`escape`] ≈ `htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`
//!   — encodes `& " ' < >` only. Already-escaped text is double-escaped, exactly
//!   like PHP.

/// Escapes the five HTML special characters, matching PHP's
/// `htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE)`.
///
/// `&` MUST be replaced first so the replacements themselves are not re-escaped.
pub fn escape(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for ch in text.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#039;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            other => out.push(other),
        }
    }
    out
}

/// Decodes HTML entities once, like PHP's `html_entity_decode(.., ENT_QUOTES)`.
///
/// Handles `&#DDD;`, `&#xHHH;` / `&#XHHH;` (with arbitrary leading zeros) and a
/// table of named entities. Undecodable references are left verbatim — matching
/// PHP, which leaves unknown entities untouched.
pub fn decode_entities(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = String::with_capacity(text.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'&' {
            if let Some((decoded, consumed)) = decode_one(&text[i..]) {
                out.push_str(&decoded);
                i += consumed;
                continue;
            }
        }
        // Not the start of a decodable entity; copy this UTF-8 char verbatim.
        let ch_len = utf8_char_len(bytes[i]);
        let end = (i + ch_len).min(bytes.len());
        out.push_str(&text[i..end]);
        i = end;
    }
    out
}

/// Length in bytes of the UTF-8 sequence whose lead byte is `b`.
fn utf8_char_len(b: u8) -> usize {
    if b < 0x80 {
        1
    } else if b >> 5 == 0b110 {
        2
    } else if b >> 4 == 0b1110 {
        3
    } else if b >> 3 == 0b11110 {
        4
    } else {
        1
    }
}

/// Attempts to decode a single entity at the start of `s` (which begins with
/// `&`). Returns the decoded string and the number of *bytes* consumed from `s`.
fn decode_one(s: &str) -> Option<(String, usize)> {
    let b = s.as_bytes();
    debug_assert_eq!(b[0], b'&');
    if b.len() < 2 {
        return None;
    }

    if b[1] == b'#' {
        return decode_numeric(s);
    }

    // Named entity: &name; — name is ASCII alnum.
    let mut j = 1;
    while j < b.len() && b[j].is_ascii_alphanumeric() {
        j += 1;
    }
    if j > 1 && j < b.len() && b[j] == b';' {
        let name = &s[1..j];
        if let Some(rep) = named_entity(name) {
            return Some((rep.to_string(), j + 1));
        }
    }
    None
}

/// Decodes a numeric character reference: `&#123;` or `&#x1F;` / `&#X1F;`.
fn decode_numeric(s: &str) -> Option<(String, usize)> {
    let b = s.as_bytes();
    // s[0]='&', s[1]='#'
    let mut j = 2;
    let radix;
    if j < b.len() && (b[j] == b'x' || b[j] == b'X') {
        radix = 16;
        j += 1;
        let start = j;
        while j < b.len() && b[j].is_ascii_hexdigit() {
            j += 1;
        }
        if j == start {
            return None;
        }
    } else {
        radix = 10;
        let start = j;
        while j < b.len() && b[j].is_ascii_digit() {
            j += 1;
        }
        if j == start {
            return None;
        }
    }
    // PHP's html_entity_decode tolerates a missing trailing ';' for numeric
    // refs, but Drupal's Xss only re-enables well-formed (`;`-terminated)
    // entities, so the protocol filter always sees a trailing ';'. Require it.
    if j >= b.len() || b[j] != b';' {
        return None;
    }
    let digits_start = if radix == 16 { 3 } else { 2 };
    let code = u32::from_str_radix(&s[digits_start..j], radix).ok()?;
    let ch = char::from_u32(code)?;
    Some((ch.to_string(), j + 1))
}

/// Maps a named HTML entity (without `&`/`;`) to its replacement text.
///
/// Covers the references that appear in sanitization paths plus the common Latin
/// set. PHP decodes the full HTML5 table; this subset is sufficient for the XSS
/// surface (where only `lt`/`gt`/`amp`/`quot`/`apos` materially affect parsing)
/// while keeping the table auditable.
fn named_entity(name: &str) -> Option<&'static str> {
    Some(match name {
        "amp" => "&",
        "lt" => "<",
        "gt" => ">",
        "quot" => "\"",
        "apos" => "'",
        "nbsp" => "\u{00A0}",
        "copy" => "\u{00A9}",
        "reg" => "\u{00AE}",
        "trade" => "\u{2122}",
        "hellip" => "\u{2026}",
        "mdash" => "\u{2014}",
        "ndash" => "\u{2013}",
        "lsquo" => "\u{2018}",
        "rsquo" => "\u{2019}",
        "ldquo" => "\u{201C}",
        "rdquo" => "\u{201D}",
        "eacute" => "\u{00E9}",
        "egrave" => "\u{00E8}",
        "agrave" => "\u{00E0}",
        "ccedil" => "\u{00E7}",
        "uuml" => "\u{00FC}",
        "ouml" => "\u{00F6}",
        "auml" => "\u{00E4}",
        "szlig" => "\u{00DF}",
        "euro" => "\u{20AC}",
        "pound" => "\u{00A3}",
        "cent" => "\u{00A2}",
        "yen" => "\u{00A5}",
        "sect" => "\u{00A7}",
        "para" => "\u{00B6}",
        "deg" => "\u{00B0}",
        "plusmn" => "\u{00B1}",
        "times" => "\u{00D7}",
        "divide" => "\u{00F7}",
        "frac12" => "\u{00BD}",
        "frac14" => "\u{00BC}",
        "frac34" => "\u{00BE}",
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escape_encodes_five_specials_only() {
        assert_eq!(escape("a&b\"c'd<e>f"), "a&amp;b&quot;c&#039;d&lt;e&gt;f");
        // é and other non-special chars pass through unchanged.
        assert_eq!(escape("\u{00E9}"), "\u{00E9}");
    }

    #[test]
    fn escape_double_escapes_already_escaped() {
        assert_eq!(escape("&lt;"), "&amp;lt;");
    }

    #[test]
    fn decode_decimal_numeric() {
        // "javascript:" via decimal refs (the XSS UTF-8 decimal vector).
        let enc = "&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;";
        assert_eq!(decode_entities(enc), "javascript:");
    }

    #[test]
    fn decode_decimal_with_leading_zeros() {
        let enc = "&#00000106&#0000097"; // missing ';' -> NOT decoded (Xss only re-enables `;`-terminated)
        assert_eq!(decode_entities(enc), enc);
        let enc2 = "&#0000058;"; // ':' with leading zeros, terminated
        assert_eq!(decode_entities(enc2), ":");
    }

    #[test]
    fn decode_hex_numeric_both_cases() {
        assert_eq!(decode_entities("&#x6A;"), "j");
        assert_eq!(decode_entities("&#X6a;"), "j");
        assert_eq!(decode_entities("&#x3A;"), ":");
    }

    #[test]
    fn decode_named_entities() {
        assert_eq!(decode_entities("&lt;script&gt;"), "<script>");
        assert_eq!(decode_entities("&eacute;"), "\u{00E9}");
        assert_eq!(decode_entities("&amp;"), "&");
    }

    #[test]
    fn unknown_entity_left_verbatim() {
        assert_eq!(decode_entities("&nosuch;"), "&nosuch;");
        assert_eq!(decode_entities("&#;"), "&#;");
        assert_eq!(decode_entities("plain & text"), "plain & text");
    }

    #[test]
    fn multibyte_passthrough() {
        assert_eq!(decode_entities("Fo\u{00F6}\u{00F1}"), "Fo\u{00F6}\u{00F1}");
    }
}
