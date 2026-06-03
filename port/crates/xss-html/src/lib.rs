//! `drupaljs-xss-html` — HTML tokenizer + allowlist XSS filter automaton.
//!
//! Faithful Rust/WASM port of `Drupal\Component\Utility\Xss` (ADR-0015), the
//! kses-derived sanitizer that protects every piece of admin-entered markup in
//! Drupal. Security-correctness — not speed — is the governing constraint, so
//! the control flow tracks the PHP source state-for-state:
//!
//! 1. Reject invalid UTF-8 (Rust's `&str` guarantees this for us).
//! 2. Strip NUL bytes and Netscape-4 JS entities (`&{ … }`).
//! 3. Defuse every `&` to `&amp;`, then re-enable only well-formed numeric and
//!    named entities — so any *partial*/malformed entity stays inert.
//! 4. Tokenize the string into text vs. tag/comment chunks and run [`split`] on
//!    each tag, dropping disallowed tags and scrubbing attributes through the
//!    URL-protocol filter ([`protocol::filter_bad_protocol`]).
//!
//! Two surfaces are exposed: a plain-Rust API ([`filter`], [`filter_admin`],
//! [`filter_with`]) for `rlib`/`cargo test` consumers, and a `#[wasm_bindgen]`
//! [`filter`](crate::filter) entry for the owning TS package.

mod entities;
mod protocol;
mod tags;

pub use protocol::DEFAULT_ALLOWED_PROTOCOLS;
pub use tags::{ADMIN_TAGS, DEFAULT_HTML_TAGS};

use wasm_bindgen::prelude::*;

/// Filters a string with the default allowed-tag list (`Xss::$htmlTags`).
///
/// Equivalent to PHP `Xss::filter($string)`.
pub fn filter(input: &str) -> String {
    filter_with(input, DEFAULT_HTML_TAGS, DEFAULT_ALLOWED_PROTOCOLS)
}

/// Permissive admin filter (`Xss::filterAdmin($string)`): all body tags except
/// scripts/styles/embeds.
pub fn filter_admin(input: &str) -> String {
    filter_with(input, ADMIN_TAGS, DEFAULT_ALLOWED_PROTOCOLS)
}

/// Core filter with an explicit allowed-tag list and allowed-protocol list.
///
/// `allowed_tags` are matched case-insensitively (Drupal lowercases element
/// names before lookup). Returns `""` for input that is not valid UTF-8 — but
/// since the input arrives as `&str`, that has already been guaranteed; this
/// signature documents the contract for the byte-level WASM boundary.
pub fn filter_with(input: &str, allowed_tags: &[&str], allowed_protocols: &[&str]) -> String {
    // Step 1: NUL removal (ignored by some browsers, used to break tag names).
    let s: String = input.chars().filter(|&c| c != '\u{0}').collect();

    // Step 2: Remove Netscape 4 JS entities: `&{ ... }` optionally `;`/EOL.
    let s = strip_netscape_js_entities(&s);

    // Step 3: Defuse all entities, then re-enable well-formed ones.
    let s = defuse_entities(&s);

    // Lowercased allow-list for O(tag) membership tests.
    let allow: Vec<String> = allowed_tags.iter().map(|t| t.to_ascii_lowercase()).collect();

    // Step 4: tokenize and process.
    tokenize_and_filter(&s, &allow, allowed_protocols)
}

/// Removes Netscape-4 JavaScript entities of the form `&{ ... }` — PHP:
/// `preg_replace('%&\s*\{[^}]*(\}\s*;?|$)%', '', $string)`.
fn strip_netscape_js_entities(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'&' {
            // Optional whitespace, then '{'.
            let mut j = i + 1;
            while j < b.len() && b[j].is_ascii_whitespace() {
                j += 1;
            }
            if j < b.len() && b[j] == b'{' {
                // Consume up to and including '}' (with optional ws + ';'), or EOL.
                let mut k = j + 1;
                while k < b.len() && b[k] != b'}' {
                    k += 1;
                }
                if k < b.len() {
                    // k points at '}'. Eat it, optional ws, optional ';'.
                    k += 1;
                    while k < b.len() && b[k].is_ascii_whitespace() {
                        k += 1;
                    }
                    if k < b.len() && b[k] == b';' {
                        k += 1;
                    }
                } else {
                    // No closing brace: matched to end of string.
                    k = b.len();
                }
                i = k;
                continue;
            }
        }
        let ch_len = utf8_char_len(b[i]);
        let end = (i + ch_len).min(b.len());
        out.push_str(&s[i..end]);
        i = end;
    }
    out
}

/// Defuses HTML entities: replace every `&` with `&amp;`, then restore only
/// well-formed numeric (decimal/hex) and named entities — the exact PHP
/// sequence of one `str_replace` + three `preg_replace` calls.
fn defuse_entities(s: &str) -> String {
    // 1. Escape every ampersand.
    let escaped = s.replace('&', "&amp;");

    // 2. Re-enable well-formed entities by un-escaping `&amp;` back to `&`
    //    when it is followed by a valid entity body terminated with `;`.
    //    Decimal: &amp;#([0-9]+;)  -> &#\1
    //    Hex:     &amp;#[Xx]0*((?:[0-9A-Fa-f]{2})+;) -> &#x\1
    //    Named:   &amp;([A-Za-z][A-Za-z0-9]*;) -> &\1
    let b = escaped.as_bytes();
    let mut out = String::with_capacity(escaped.len());
    let mut i = 0;
    const AMP: &[u8] = b"&amp;";
    while i < b.len() {
        if b[i..].starts_with(AMP) {
            let after = i + AMP.len();
            if let Some(consumed) = match_reenabled_entity(&escaped[after..]) {
                // Emit a real '&' plus the entity body (which still has its ';').
                out.push('&');
                out.push_str(&escaped[after..after + consumed]);
                i = after + consumed;
                continue;
            }
            // Not a re-enabled entity: keep the literal "&amp;".
            out.push_str("&amp;");
            i = after;
            continue;
        }
        let ch_len = utf8_char_len(b[i]);
        let end = (i + ch_len).min(b.len());
        out.push_str(&escaped[i..end]);
        i = end;
    }
    out
}

/// If `rest` begins with the body of a well-formed entity (the part *after*
/// `&`), returns the number of bytes that body occupies (including the trailing
/// `;`). Mirrors the three Drupal "change back" regexes.
///
/// For hex, Drupal's regex `&amp;#[Xx]0*((?:[0-9A-Fa-f]{2})+;)` requires the
/// post-`0*` hex run to have *even* length; the re-enabled body keeps an `x`
/// prefix (`&#x..;`). We reproduce that even-length constraint.
fn match_reenabled_entity(rest: &str) -> Option<usize> {
    let b = rest.as_bytes();
    if b.is_empty() {
        return None;
    }
    if b[0] == b'#' {
        // Numeric.
        if b.len() >= 2 && (b[1] == b'x' || b[1] == b'X') {
            // Hex: '#', [Xx], 0*, then even count of hex digits, ';'.
            // `0*` is greedy but BACKTRACKS so the trailing
            // `((?:[0-9A-Fa-f]{2})+;)` can claim an even-length hex pair group.
            // We therefore measure the leading-zero count and the full hex run,
            // then require that *some* split `zeros = z`, `pairs = run - z` is
            // valid: `run - z` even and `>= 2`. This is what re-enables
            // `&#x09;`, `&#x0D;`, `&#x000000A;` (the whitespace-in-scheme
            // evasions) so the protocol filter can later strip them.
            let mut leading_zeros = 0usize;
            while 2 + leading_zeros < b.len() && b[2 + leading_zeros] == b'0' {
                leading_zeros += 1;
            }
            let hex_start = 2;
            let mut j = 2;
            while j < b.len() && b[j].is_ascii_hexdigit() {
                j += 1;
            }
            let run_len = j - hex_start; // total hex digits incl. leading zeros
            if !(j < b.len() && b[j] == b';') {
                return None;
            }
            // Need z in [0, leading_zeros] with (run_len - z) even and >= 2.
            let mut ok = false;
            let max_z = leading_zeros.min(run_len);
            for z in 0..=max_z {
                let rem = run_len - z;
                if rem >= 2 && rem % 2 == 0 {
                    ok = true;
                    break;
                }
            }
            if ok {
                // Keep `#x` + original hex run + `;` verbatim; downstream
                // `decode_entities` is case- and leading-zero-tolerant.
                return Some(j + 1);
            }
            return None;
        }
        // Decimal: '#', [0-9]+, ';'.
        let mut j = 1;
        let start = j;
        while j < b.len() && b[j].is_ascii_digit() {
            j += 1;
        }
        if j == start {
            return None;
        }
        if j < b.len() && b[j] == b';' {
            return Some(j + 1);
        }
        return None;
    }
    // Named: [A-Za-z][A-Za-z0-9]*;
    if b[0].is_ascii_alphabetic() {
        let mut j = 1;
        while j < b.len() && b[j].is_ascii_alphanumeric() {
            j += 1;
        }
        if j < b.len() && b[j] == b';' {
            return Some(j + 1);
        }
    }
    None
}

/// Byte length of a UTF-8 sequence given its lead byte.
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

/// Walks the (entity-defused) string and applies [`split`] to every construct
/// the PHP splitter regex matches: a lone `<`, an `<!-- comment -->`, a
/// `<...>`-up-to-`>`-or-EOL tag, or a lone `>`. Everything else is text.
fn tokenize_and_filter(s: &str, allow: &[String], allowed_protocols: &[&str]) -> String {
    let b = s.as_bytes();
    let mut out = String::with_capacity(s.len());
    let mut i = 0;
    while i < b.len() {
        match b[i] {
            b'>' => {
                // Lone '>'.
                out.push_str(&split(">", allow, allowed_protocols));
                i += 1;
            }
            b'<' => {
                // Determine which alternative of the splitter regex matches.
                if i + 1 >= b.len() {
                    // Trailing lone '<'.
                    out.push_str(&split("<", allow, allowed_protocols));
                    i += 1;
                    continue;
                }
                let next = b[i + 1];
                // `<(?=[^a-zA-Z!/])` — a lone '<' not followed by a tag-ish char.
                if !(next.is_ascii_alphabetic() || next == b'!' || next == b'/') {
                    out.push_str(&split("<", allow, allowed_protocols));
                    i += 1;
                    continue;
                }
                // Comment: `<!--.*?-->` (non-greedy, '.' excludes newline in PHP
                // by default, but DOTALL is not set; Drupal comments rarely span
                // lines and the splitter falls through to the generic tag case
                // otherwise — we honor the shortest `-->`).
                if s[i..].starts_with("<!--") {
                    if let Some(rel_end) = s[i + 4..].find("-->") {
                        let end = i + 4 + rel_end + 3;
                        out.push_str(&split(&s[i..end], allow, allowed_protocols));
                        i = end;
                        continue;
                    }
                    // No closing `-->`: fall through to generic `<[^>]*(>|$)`.
                }
                // Generic tag: `<[^>]*(>|$)` — up to and including the next '>'
                // or end of string.
                let rel = s[i..].find('>');
                let end = match rel {
                    Some(p) => i + p + 1, // include '>'
                    None => b.len(),      // to EOL
                };
                out.push_str(&split(&s[i..end], allow, allowed_protocols));
                i = end;
            }
            _ => {
                let ch_len = utf8_char_len(b[i]);
                let chunk_end = (i + ch_len).min(b.len());
                out.push_str(&s[i..chunk_end]);
                i = chunk_end;
            }
        }
    }
    out
}

/// Processes a single matched tag/comment, port of `Xss::split()`.
///
/// Returns the cleaned element, an escaped `&lt;`/`&gt;` for lone brackets, or
/// `""` for disallowed/seriously-malformed tags.
fn split(chunk: &str, allow: &[String], allowed_protocols: &[&str]) -> String {
    if !chunk.starts_with('<') {
        // Matched a lone '>' character.
        return "&gt;".to_string();
    }
    if chunk.len() == 1 {
        // Matched a lone '<' character.
        return "&lt;".to_string();
    }

    // Parse: `^<\s*(/\s*)?([a-zA-Z0-9\-]+)\s*([^>]*)>?|(<!--.*?-->)$`
    let parsed = parse_tag(chunk);
    let Some(p) = parsed else {
        // Seriously malformed.
        return String::new();
    };

    let elem = if p.is_comment { "!--".to_string() } else { p.elem };

    // needsRemoval: removed unless the (lowercased) element is allow-listed.
    if !allow.iter().any(|t| *t == elem.to_ascii_lowercase()) {
        return String::new();
    }

    if p.is_comment {
        return p.comment;
    }

    if p.slash {
        return format!("</{elem}>");
    }

    // Trailing XHTML self-closing slash on the attribute string?
    let (attrs, xhtml_slash) = strip_trailing_slash(&p.attributes);

    let attr_list = attributes(&attrs, allowed_protocols);
    let mut attr2 = attr_list.join(" ");
    // Strip any stray '<' or '>' from the assembled attributes.
    attr2.retain(|c| c != '<' && c != '>');
    let attr2 = if attr2.is_empty() {
        String::new()
    } else {
        format!(" {attr2}")
    };

    format!("<{elem}{attr2}{xhtml_slash}>")
}

/// Result of matching the `split()` tag regex.
struct ParsedTag {
    slash: bool,
    elem: String,
    attributes: String,
    is_comment: bool,
    comment: String,
}

/// Reproduces `preg_match('%^<\s*(/\s*)?([a-zA-Z0-9\-]+)\s*([^>]*)>?|(<!--.*?-->)$%')`.
fn parse_tag(chunk: &str) -> Option<ParsedTag> {
    // Comment alternative: the whole chunk is `<!-- ... -->`.
    if chunk.starts_with("<!--") && chunk.ends_with("-->") && chunk.len() >= 7 {
        return Some(ParsedTag {
            slash: false,
            elem: String::new(),
            attributes: String::new(),
            is_comment: true,
            comment: chunk.to_string(),
        });
    }

    let b = chunk.as_bytes();
    // Must start with '<'.
    if b.is_empty() || b[0] != b'<' {
        return None;
    }
    let mut i = 1;
    // \s*
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    // (/\s*)?
    let mut slash = false;
    if i < b.len() && b[i] == b'/' {
        slash = true;
        i += 1;
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
    }
    // ([a-zA-Z0-9\-]+)  — element name, at least one char.
    let name_start = i;
    while i < b.len() && (b[i].is_ascii_alphanumeric() || b[i] == b'-') {
        i += 1;
    }
    if i == name_start {
        // No element name => seriously malformed.
        return None;
    }
    let elem = chunk[name_start..i].to_string();
    // \s*
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    // ([^>]*) — attributes up to (but not including) a '>' or end.
    let attr_start = i;
    while i < b.len() && b[i] != b'>' {
        i += 1;
    }
    let attributes = chunk[attr_start..i].to_string();
    // Optional trailing '>' is consumed by the regex but irrelevant here.

    Some(ParsedTag {
        slash,
        elem,
        attributes,
        is_comment: false,
        comment: String::new(),
    })
}

/// Port of `preg_replace('%(\s?)/\s*$%', '\1', $attributes, -1, $count)`:
/// removes a trailing XHTML self-closing slash, returning the cleaned
/// attribute string and `" /"` if a slash was present (else `""`).
fn strip_trailing_slash(attributes: &str) -> (String, &'static str) {
    let trimmed_end = attributes.trim_end_matches(|c: char| c.is_ascii_whitespace());
    if let Some(stripped) = trimmed_end.strip_suffix('/') {
        // Preserve a single leading-space group `(\s?)` => the char before '/'
        // if it was whitespace collapses to one space, matching `\1`.
        let keep = stripped.trim_end_matches(|c: char| c.is_ascii_whitespace());
        let had_space = keep.len() != stripped.len();
        let mut s = keep.to_string();
        if had_space {
            s.push(' ');
        }
        (s, " /")
    } else {
        (attributes.to_string(), "")
    }
}

/// State machine port of `Xss::attributes()`.
///
/// Walks the raw attribute string, validating names and (for URI-bearing
/// attributes) filtering values through [`protocol::filter_bad_protocol`].
/// Drops event handlers (`on*`), `style`, `srcdoc`, `-`/`--`-prefixed names and
/// over-long names; preserves data-* and a small set of non-URI attributes
/// without protocol filtering.
fn attributes(attributes: &str, allowed_protocols: &[&str]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut mode = 0u8;
    let mut attribute_name = String::new();
    let mut skip = false;
    let mut skip_protocol_filtering = false;
    let mut rest = attributes.to_string();

    while !rest.is_empty() {
        let mut working = false;

        match mode {
            0 => {
                // Attribute name: ^([-a-zA-Z][-a-zA-Z0-9]*)
                if let Some(name) = match_attr_name(&rest) {
                    attribute_name = name.to_ascii_lowercase();
                    skip = attribute_name == "style"
                        || attribute_name == "srcdoc"
                        || attribute_name.starts_with("on")
                        || attribute_name.starts_with('-')
                        || attribute_name.len() > 96;

                    skip_protocol_filtering = attribute_name.starts_with("data-")
                        || matches!(
                            attribute_name.as_str(),
                            "title" | "alt" | "rel" | "property" | "class" | "datetime"
                        );

                    working = true;
                    mode = 1;
                    rest = rest[name.len()..].to_string();
                }
            }
            1 => {
                // Equals sign or valueless attribute.
                if let Some(consumed) = match_equals(&rest) {
                    working = true;
                    mode = 2;
                    rest = rest[consumed..].to_string();
                } else if let Some(consumed) = match_leading_ws(&rest) {
                    working = true;
                    mode = 0;
                    if !skip {
                        out.push(attribute_name.clone());
                    }
                    rest = rest[consumed..].to_string();
                }
            }
            2 => {
                // Attribute value.
                mode = 0;
                working = true;
                if let Some((value, consumed)) = match_double_quoted(&rest) {
                    let v = finalize_value(value, skip_protocol_filtering, allowed_protocols);
                    if !skip {
                        out.push(format!("{attribute_name}=\"{v}\""));
                    }
                    rest = rest[consumed..].to_string();
                } else if let Some((value, consumed)) = match_single_quoted(&rest) {
                    let v = finalize_value(value, skip_protocol_filtering, allowed_protocols);
                    if !skip {
                        out.push(format!("{attribute_name}='{v}'"));
                    }
                    rest = rest[consumed..].to_string();
                } else if let Some((value, consumed)) = match_unquoted(&rest) {
                    let v = finalize_value(value, skip_protocol_filtering, allowed_protocols);
                    if !skip {
                        out.push(format!("{attribute_name}=\"{v}\""));
                    }
                    rest = rest[consumed..].to_string();
                }
            }
            _ => unreachable!(),
        }

        if !working {
            // Not well-formed: drop one malformed token and reset to mode 0.
            rest = drop_malformed_prefix(&rest);
            mode = 0;
        }
    }

    // Trailing valueless attribute (mode 1 with a pending name).
    if mode == 1 && !skip {
        out.push(attribute_name);
    }

    out
}

fn finalize_value(value: &str, skip_protocol_filtering: bool, allowed_protocols: &[&str]) -> String {
    if skip_protocol_filtering {
        value.to_string()
    } else {
        protocol::filter_bad_protocol(value, allowed_protocols)
    }
}

/// `^([-a-zA-Z][-a-zA-Z0-9]*)` — returns the matched name slice length-bounded.
fn match_attr_name(s: &str) -> Option<&str> {
    let b = s.as_bytes();
    if b.is_empty() {
        return None;
    }
    if !(b[0] == b'-' || b[0].is_ascii_alphabetic()) {
        return None;
    }
    let mut i = 1;
    while i < b.len() && (b[i] == b'-' || b[i].is_ascii_alphanumeric()) {
        i += 1;
    }
    Some(&s[..i])
}

/// `^\s*=\s*` — returns bytes consumed.
fn match_equals(s: &str) -> Option<usize> {
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    if i < b.len() && b[i] == b'=' {
        i += 1;
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        Some(i)
    } else {
        None
    }
}

/// `^\s+` — returns bytes consumed (>=1) or None.
fn match_leading_ws(s: &str) -> Option<usize> {
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    if i > 0 {
        Some(i)
    } else {
        None
    }
}

/// `^"([^"]*)"(\s+|$)` — returns (value, bytes consumed).
fn match_double_quoted(s: &str) -> Option<(&str, usize)> {
    matched_quoted(s, b'"')
}

/// `^'([^']*)'(\s+|$)` — returns (value, bytes consumed).
fn match_single_quoted(s: &str) -> Option<(&str, usize)> {
    matched_quoted(s, b'\'')
}

fn matched_quoted(s: &str, q: u8) -> Option<(&str, usize)> {
    let b = s.as_bytes();
    if b.is_empty() || b[0] != q {
        return None;
    }
    let mut i = 1;
    while i < b.len() && b[i] != q {
        i += 1;
    }
    if i >= b.len() {
        // No closing quote => not this alternative.
        return None;
    }
    // i is the closing quote.
    let value = &s[1..i];
    let mut j = i + 1;
    // (\s+|$)
    if j == b.len() {
        return Some((value, j));
    }
    let ws_start = j;
    while j < b.len() && b[j].is_ascii_whitespace() {
        j += 1;
    }
    if j > ws_start {
        Some((value, j))
    } else {
        // Trailing non-space after the closing quote => alternative fails.
        None
    }
}

/// `^([^\s"']+)(\s+|$)` — unquoted value; returns (value, bytes consumed).
fn match_unquoted(s: &str) -> Option<(&str, usize)> {
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() && !b[i].is_ascii_whitespace() && b[i] != b'"' && b[i] != b'\'' {
        i += 1;
    }
    if i == 0 {
        return None;
    }
    // `(\s+|$)`: the run must end at whitespace or end-of-string. If the next
    // char is a quote (which terminated `[^\s"']+`), this alternative fails —
    // matching PHP, where `onmouseover="..."` is NOT consumed as an unquoted
    // value and is instead re-parsed as a fresh (then-dropped) attribute name.
    if i < b.len() && !b[i].is_ascii_whitespace() {
        return None;
    }
    let value = &s[..i];
    let mut j = i;
    while j < b.len() && b[j].is_ascii_whitespace() {
        j += 1;
    }
    Some((value, j))
}

/// Port of the "not well-formed" cleanup regex:
/// `^("[^"]*("|$)|'[^']*('|$)|\S)*\s*`.
///
/// Greedily consumes runs of quoted strings / non-whitespace chars, then any
/// trailing whitespace — guaranteeing forward progress so the loop terminates.
fn drop_malformed_prefix(s: &str) -> String {
    let b = s.as_bytes();
    let mut i = 0;
    loop {
        if i >= b.len() {
            break;
        }
        match b[i] {
            b'"' => {
                i += 1;
                while i < b.len() && b[i] != b'"' {
                    i += 1;
                }
                if i < b.len() {
                    i += 1; // closing quote
                }
            }
            b'\'' => {
                i += 1;
                while i < b.len() && b[i] != b'\'' {
                    i += 1;
                }
                if i < b.len() {
                    i += 1;
                }
            }
            c if !c.is_ascii_whitespace() => {
                i += 1;
            }
            _ => break, // whitespace ends the (...)* group
        }
    }
    // \s*
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    // Guarantee progress: if nothing matched, drop one byte (regex `*` could
    // match empty, but PHP advances because the surrounding loop re-runs on a
    // shorter string only when something was removed; mirror by force-advancing).
    if i == 0 && !s.is_empty() {
        let step = utf8_char_len(b[0]);
        return s[step..].to_string();
    }
    s[i..].to_string()
}

// ---------------------------------------------------------------------------
// WASM boundary
// ---------------------------------------------------------------------------

/// WASM entry point: filter `html` against a list of `allowed_tags`.
///
/// `allowed_tags` is a JS `string[]`. When `undefined`/`null`, falls back to the
/// default `Xss::filter` tag list. Uses the standard Drupal allowed-protocol set.
#[wasm_bindgen(js_name = filter)]
pub fn filter_wasm(html: &str, allowed_tags: JsValue) -> Result<String, JsValue> {
    if allowed_tags.is_undefined() || allowed_tags.is_null() {
        return Ok(filter(html));
    }
    let tags: Vec<String> = serde_wasm_bindgen::from_value(allowed_tags)
        .map_err(|e| JsValue::from_str(&format!("allowed_tags must be string[]: {e}")))?;
    let refs: Vec<&str> = tags.iter().map(|s| s.as_str()).collect();
    Ok(filter_with(html, &refs, DEFAULT_ALLOWED_PROTOCOLS))
}

/// WASM entry point for the permissive admin filter (`Xss::filterAdmin`).
#[wasm_bindgen(js_name = filterAdmin)]
pub fn filter_admin_wasm(html: &str) -> String {
    filter_admin(html)
}

// ---------------------------------------------------------------------------
// Tests — TDD: these encode the security contract (XSS vectors neutralized,
// allowed markup preserved), mirroring Drupal core's XssTest data providers.
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    /// Test harness equivalent of XssTest::assertNotNormalized — the decoded,
    /// lowercased output must NOT contain the dangerous needle.
    fn assert_not_normalized(output: &str, needle: &str) {
        let normalized = entities::decode_entities(output).to_lowercase();
        assert!(
            !normalized.contains(needle),
            "expected {needle:?} to be absent from normalized {output:?} (-> {normalized:?})"
        );
    }

    /// Equivalent of assertNormalized — decoded+lowercased output CONTAINS needle.
    fn assert_normalized(output: &str, needle: &str) {
        let normalized = entities::decode_entities(output).to_lowercase();
        assert!(
            normalized.contains(needle),
            "expected {needle:?} present in normalized {output:?} (-> {normalized:?})"
        );
    }

    // ---- Tag stripping / script injection vectors -----------------------

    #[test]
    fn strips_script_simple() {
        assert_not_normalized(&filter("<script>alert(0)</script>"), "script");
    }

    #[test]
    fn strips_script_with_source() {
        assert_not_normalized(&filter("<script src=\"http://www.example.com\" />"), "script");
    }

    #[test]
    fn strips_script_varying_case() {
        assert_not_normalized(&filter("<ScRipt sRc=http://www.example.com/>"), "script");
    }

    #[test]
    fn strips_script_multiline() {
        assert_not_normalized(&filter("<script\nsrc\n=\nhttp://www.example.com/\n>"), "script");
    }

    #[test]
    fn strips_script_nonspace_after_tag() {
        assert_not_normalized(&filter("<script/a src=http://www.example.com/a.js></script>"), "script");
    }

    #[test]
    fn strips_script_no_space_between_tag_and_attr() {
        assert_not_normalized(&filter("<script/src=http://www.example.com/a.js></script>"), "script");
    }

    #[test]
    fn strips_script_with_nulls() {
        assert_not_normalized(&filter("<\0scr\0ipt>alert(0)</script>"), "ipt");
    }

    #[test]
    fn strips_nested_script_substring() {
        assert_not_normalized(&filter("<scrscriptipt src=http://www.example.com/a.js>"), "script");
    }

    #[test]
    fn strips_double_opening_brackets() {
        assert_not_normalized(&filter("<<script>alert(0);//<</script>"), "script");
    }

    #[test]
    fn strips_script_no_closing_tag() {
        assert_not_normalized(&filter("<script src=http://www.example.com/a.js?<b>"), "script");
    }

    #[test]
    fn strips_script_double_closing() {
        assert_not_normalized(&filter("<script>>"), "script");
    }

    #[test]
    fn strips_script_no_scheme_no_slash() {
        assert_not_normalized(&filter("<script src=//www.example.com/.a>"), "script");
    }

    #[test]
    fn strips_script_no_closing_bracket() {
        assert_not_normalized(&filter("<script src=http://www.example.com/.a"), "script");
    }

    #[test]
    fn strips_script_opening_instead_of_closing() {
        assert_not_normalized(&filter("<script src=http://www.example.com/ <"), "script");
    }

    #[test]
    fn strips_unknown_tag() {
        assert_not_normalized(&filter("<nosuchtag attribute=\"newScriptInjectionVector\">"), "nosuchtag");
    }

    #[test]
    fn strips_namespaced_tag() {
        assert_not_normalized(
            &filter("<t:set attributeName=\"innerHTML\" to=\"&lt;script defer&gt;alert(0)&lt;/script&gt;\">"),
            "t:set",
        );
    }

    #[test]
    fn strips_script_in_malformed_img() {
        assert_not_normalized(&filter_with("<img \"\"\"><script>alert(0)</script>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "script");
    }

    #[test]
    fn strips_script_in_blockquote() {
        assert_not_normalized(
            &filter_with("<blockquote><script>alert(0)</script></blockquote>", &["blockquote"], DEFAULT_ALLOWED_PROTOCOLS),
            "script",
        );
    }

    #[test]
    fn strips_script_in_conditional_comment() {
        assert_not_normalized(&filter("<!--[if true]><script>alert(0)</script><![endif]-->"), "script");
    }

    // ---- Dangerous attribute removal ------------------------------------

    #[test]
    fn removes_event_handler() {
        assert_not_normalized(&filter_with("<p onmouseover=\"http://www.example.com/\">", &["p"], DEFAULT_ALLOWED_PROTOCOLS), "onmouseover");
    }

    #[test]
    fn removes_style_attribute() {
        assert_not_normalized(&filter_with("<li style=\"list-style-image: url(javascript:alert(0))\">", &["li"], DEFAULT_ALLOWED_PROTOCOLS), "style");
    }

    #[test]
    fn removes_onerror_with_spaces_before_equals() {
        assert_not_normalized(&filter_with("<img onerror   =alert(0)>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "onerror");
    }

    #[test]
    fn removes_onabort_with_nonalnum_before_equals() {
        assert_not_normalized(&filter_with("<img onabort!#$%&()*~+-_.,:;?@[/|\\]^`=alert(0)>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "onabort");
    }

    #[test]
    fn removes_onmediaerror_varying_case() {
        assert_not_normalized(&filter_with("<img oNmediAError=alert(0)>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "onmediaerror");
    }

    #[test]
    fn removes_onfocus_with_nulls() {
        assert_not_normalized(&filter_with("<img o\0nfocus\0=alert(0)>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "focus");
    }

    #[test]
    fn removes_srcdoc_attribute() {
        assert_not_normalized(
            &filter_with("<iframe srcdoc=\"&lt;script&gt;alert(document.cookie)&lt;/script&gt;\"></iframe>", &["iframe"], DEFAULT_ALLOWED_PROTOCOLS),
            "srcdoc",
        );
    }

    // ---- Protocol (scheme) clearing -------------------------------------

    #[test]
    fn clears_javascript_quoted() {
        assert_not_normalized(&filter_with("<img src=\"javascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_unquoted() {
        assert_not_normalized(&filter_with("<img src=javascript:alert(0)>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_grave_accents() {
        assert_not_normalized(&filter_with("<img src=`javascript:alert(0)`>", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_dynsrc() {
        assert_not_normalized(&filter_with("<img dynsrc=\"javascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_background() {
        assert_not_normalized(&filter_with("<table background=\"javascript:alert(0)\">", &["table"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_base_href() {
        assert_not_normalized(&filter_with("<base href=\"javascript:alert(0);//\">", &["base"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_varying_case() {
        assert_not_normalized(&filter_with("<img src=\"jaVaSCriPt:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_decimal_entities() {
        let v = "<img src=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#48;&#41;>";
        assert_not_normalized(&filter_with(v, &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_hex_entities() {
        let v = "<img src=&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x30&#x29>";
        assert_not_normalized(&filter_with(v, &["img"], DEFAULT_ALLOWED_PROTOCOLS), "javascript");
    }

    #[test]
    fn clears_javascript_embedded_tab() {
        assert_not_normalized(&filter_with("<img src=\"jav\tascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "script");
    }

    #[test]
    fn clears_javascript_encoded_tab() {
        assert_not_normalized(&filter_with("<img src=\"jav&#x09;ascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "script");
    }

    #[test]
    fn clears_javascript_encoded_newline() {
        assert_not_normalized(&filter_with("<img src=\"jav&#x000000A;ascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "script");
    }

    #[test]
    fn clears_javascript_encoded_cr() {
        assert_not_normalized(&filter_with("<img src=\"jav&#x0D;ascript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "script");
    }

    #[test]
    fn clears_javascript_broken_lines() {
        assert_not_normalized(&filter_with("<img src=\"\n\n\nj\na\nva\ns\ncript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "cript");
    }

    #[test]
    fn clears_javascript_embedded_nulls() {
        assert_not_normalized(&filter_with("<img src=\"jav\0a\0\0cript:alert(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "cript");
    }

    #[test]
    fn clears_vbscript() {
        assert_not_normalized(&filter_with("<img src=\"vbscript:msgbox(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "vbscript");
    }

    #[test]
    fn clears_unknown_scheme() {
        assert_not_normalized(&filter_with("<img src=\"nosuchscheme:notice(0)\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS), "nosuchscheme");
    }

    #[test]
    fn clears_data_uri_scheme() {
        // data: is dangerous and not allow-listed -> scheme stripped.
        assert_not_normalized(
            &filter_with("<img src=\"data:text/html;base64,PHNjcmlwdD4=\">", &["img"], DEFAULT_ALLOWED_PROTOCOLS),
            "data:",
        );
    }

    #[test]
    fn removes_netscape_js_entity() {
        assert_not_normalized(&filter_with("<br size=\"&{alert(0)}\">", &["br"], DEFAULT_ALLOWED_PROTOCOLS), "alert");
    }

    // ---- Allowed markup preserved ---------------------------------------

    #[test]
    fn preserves_img_with_alt_title_class() {
        let v = "<img src=\"http://example.com/foo.jpg\" title=\"Example: title\" alt=\"Example: alt\" class=\"md:block\">";
        assert_eq!(filter_with(v, &["img"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_link_with_rel() {
        let v = "<a href=\"https://www.drupal.org/\" rel=\"dc:publisher\">Drupal</a>";
        assert_eq!(filter_with(v, &["a"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_span_property() {
        let v = "<span property=\"dc:subject\">Drupal 8: The best release ever.</span>";
        assert_eq!(filter_with(v, &["span"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_data_attribute() {
        let v = "<img src=\"http://example.com/foo.jpg\" data-caption=\"Drupal 8: The best release ever.\">";
        assert_eq!(filter_with(v, &["img"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_numeric_data_attribute() {
        let v = "<a data-a2a-url=\"foo\"></a>";
        assert_eq!(filter_with(v, &["a"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_del_datetime() {
        let v = "<del datetime=\"1789-08-22T12:30:00.1-04:00\">deleted text</del>";
        assert_eq!(filter_with(v, &["del"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn preserves_custom_element_with_dashes() {
        let v = "<test-element></test-element>";
        assert_eq!(filter_with(v, &["test-element"], DEFAULT_ALLOWED_PROTOCOLS), v);
    }

    #[test]
    fn malformed_src_yields_bare_img() {
        let v = "<img src= onmouseover=\"script('alert');\">";
        assert_eq!(filter_with(v, &["img"], DEFAULT_ALLOWED_PROTOCOLS), "<img>");
    }

    #[test]
    fn dash_prefixed_attribute_dropped() {
        let v = "<a -dummy=': href=javascript:alert(\"oh\\x20no\")//'>I'm magic, click me!</a>";
        assert_eq!(
            filter_with(v, &["a"], DEFAULT_ALLOWED_PROTOCOLS),
            "<a>I'm magic, click me!</a>"
        );
    }

    #[test]
    fn long_attribute_name_dropped() {
        let name = "z".repeat(97);
        let v = format!("<a {name}-x=': href=javascript:alert(0)//'>hi</a>");
        assert_eq!(filter_with(&v, &["a"], DEFAULT_ALLOWED_PROTOCOLS), "<a>hi</a>");
    }

    // ---- Entity normalization -------------------------------------------

    #[test]
    fn entity_html_number_preserved() {
        // "Who&#039;s Online" -> normalized contains "who's online"
        assert_normalized(&filter("Who&#039;s Online"), "who's online");
    }

    #[test]
    fn encoded_entity_number_double_handled() {
        // "Who&amp;#039;s Online" -> "who&#039;s online"
        assert_normalized(&filter("Who&amp;#039;s Online"), "who&#039;s online");
    }

    #[test]
    fn double_encoded_entity() {
        assert_normalized(&filter("Who&amp;amp;#039; Online"), "who&amp;#039; online");
    }

    // ---- filterAdmin ----------------------------------------------------

    #[test]
    fn admin_strips_object_and_script() {
        assert_not_normalized(&filter_admin("<object />"), "object");
        assert_not_normalized(&filter_admin("<script />"), "script");
    }

    #[test]
    fn admin_strips_all_dangerous_structural_tags() {
        let v = "<style /><iframe /><frame /><frameset /><meta /><link /><embed /><applet /><param /><layer />";
        assert_eq!(filter_admin(v), "");
    }

    #[test]
    fn admin_preserves_inline_markup() {
        let v = "<p>Hello <strong>world</strong> and <em>everyone</em></p>";
        assert_eq!(filter_admin(v), v);
    }

    // ---- Misc / structural ----------------------------------------------

    #[test]
    fn lone_brackets_escaped() {
        assert_eq!(filter("a < b"), "a &lt; b");
        assert_eq!(filter("a > b"), "a &gt; b");
        assert_eq!(filter("5 < 7 and 8 > 6"), "5 &lt; 7 and 8 &gt; 6");
    }

    #[test]
    fn empty_input() {
        assert_eq!(filter(""), "");
    }

    #[test]
    fn plain_text_passthrough() {
        assert_eq!(filter("just some plain text"), "just some plain text");
    }

    #[test]
    fn question_sign_processing_instruction_stripped() {
        let out = filter("<?xml:namespace ns=\"urn:schemas-microsoft-com:time\">");
        assert!(!out.to_lowercase().contains("<?xml"), "got: {out}");
    }

    #[test]
    fn closing_tag_for_allowed_element_kept() {
        assert_eq!(filter("<em>hi</em>"), "<em>hi</em>");
    }

    #[test]
    fn disallowed_tag_text_content_preserved() {
        // Tag stripped, inner text remains.
        assert_eq!(filter("<div>keep me</div>"), "keep me");
    }

    #[test]
    fn never_panics_on_adversarial_input() {
        // Property-ish: a pile of nasty fragments must all terminate & return.
        let vectors = [
            "<<<<<<>>>>>>",
            "<a href=\"\u{0}\u{0}\u{0}\">",
            "&&&&amp;amp;#",
            "<img src=\"jav\0\0\0a\0script:x\">",
            "<!-- unterminated comment <script>",
            "<a b='c\"d e=f\"g'h>",
            &"<".repeat(1000),
            &"&".repeat(1000),
        ];
        for v in vectors {
            let _ = filter(v);
            let _ = filter_admin(v);
        }
    }
}
