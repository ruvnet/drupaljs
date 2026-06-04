//! Deterministic Unicode -> US-ASCII transliteration, a Rust/WASM port of
//! Drupal core's `Drupal\Component\Transliteration\PhpTransliteration`.
//!
//! Two public surfaces:
//!   * a plain-Rust API ([`transliterate`], [`remove_diacritics`]) for native
//!     callers and `cargo test`;
//!   * `#[wasm_bindgen]` wrappers ([`transliterate_wasm`],
//!     [`remove_diacritics_wasm`]) for the consuming TS package.
//!
//! The generic transliteration tables live in [`data`]. Language overrides are
//! out of scope for this crate slice (the `langcode` argument is accepted for
//! API parity and forwarded, but no override tables are bundled yet).
//!
//! TODO(@drupaljs): language-specific override tables (de, da, kg, ...) and the
//! remaining generic banks (x03+) are not yet ported. Until then unknown code
//! points fall back to the substitution character, matching PHP behaviour for
//! characters with no table entry.

mod data;

/// Replaces a single Unicode code point with its US-ASCII transliteration.
///
/// Mirrors `PhpTransliteration::replace()` + `lookupReplacement()`:
///   * code points below 0x80 are returned as-is (already ASCII);
///   * otherwise the generic tables are consulted;
///   * a table miss yields `unknown`.
fn replace(code: u32, unknown: &str) -> String {
    if code < 0x80 {
        // Safe: every value < 0x80 is a valid scalar value.
        return char::from_u32(code).unwrap().to_string();
    }
    match data::lookup(code) {
        Some(s) => s.to_string(),
        None => unknown.to_string(),
    }
}

/// Transliterates `input` to US-ASCII, character by character.
///
/// * `unknown` is substituted for any code point with no transliteration.
/// * `_langcode` is accepted for API parity with Drupal; language overrides
///   are not yet bundled (see crate-level TODO).
///
/// Deterministic: identical input always produces identical output.
pub fn transliterate(input: &str, unknown: &str, _langcode: &str) -> String {
    let mut result = String::with_capacity(input.len());
    for ch in input.chars() {
        result.push_str(&replace(ch as u32, unknown));
    }
    result
}

/// `removeDiacritics` special-cases: characters whose base transliterates to
/// more than one ASCII char, where we want the un-transliterated base glyph.
/// Mirrors `PhpTransliteration::$fixTransliterateForRemoveDiacritics`.
fn fix_remove_diacritics(to_add: &str) -> Option<char> {
    match to_add {
        "AE" => Some('\u{00C6}'), // Æ
        "ae" => Some('\u{00E6}'), // æ
        "ZH" => Some('\u{01B7}'), // Ʒ
        "zh" => Some('\u{0292}'), // ʒ
        _ => None,
    }
}

/// Removes diacritical marks from accented Latin letters while leaving every
/// other character untouched. Port of `PhpTransliteration::removeDiacritics()`.
///
/// Only the two accented-letter ranges Drupal targets are processed, with the
/// same exclusion lists, so e.g. `Ð`, `×`, `ŋ` pass through unchanged.
pub fn remove_diacritics(input: &str) -> String {
    const EXCLUSIONS_RANGE1: [u32; 7] =
        [0x00d0, 0x00d7, 0x00f0, 0x00f7, 0x0138, 0x014a, 0x014b];
    const EXCLUSIONS_RANGE2: [u32; 9] = [
        0x01dd, 0x01f7, 0x021c, 0x021d, 0x0220, 0x0221, 0x0241, 0x0242, 0x0245,
    ];

    let mut result = String::with_capacity(input.len());
    for ch in input.chars() {
        let code = ch as u32;
        let range1 = code > 0x00bf && code < 0x017f;
        let range2 = code > 0x01cc && code < 0x0250;

        let in_range = (range1 && !EXCLUSIONS_RANGE1.contains(&code))
            || (range2 && !EXCLUSIONS_RANGE2.contains(&code));

        let mut replacement = ch.to_string();
        if in_range {
            if let Some(to_add) = data::lookup(code) {
                if to_add.chars().count() == 1 {
                    replacement = to_add.to_string();
                } else if let Some(base) = fix_remove_diacritics(to_add) {
                    replacement = base.to_string();
                }
            }
        }
        result.push_str(&replacement);
    }
    result
}

// ---------------------------------------------------------------------------
// WASM bindings
// ---------------------------------------------------------------------------

use wasm_bindgen::prelude::*;

/// WASM export mirroring [`transliterate`].
#[wasm_bindgen(js_name = transliterate)]
pub fn transliterate_wasm(input: &str, unknown: &str, langcode: &str) -> String {
    transliterate(input, unknown, langcode)
}

/// WASM export mirroring [`remove_diacritics`].
#[wasm_bindgen(js_name = removeDiacritics)]
pub fn remove_diacritics_wasm(input: &str) -> String {
    remove_diacritics(input)
}

// ---------------------------------------------------------------------------
// Tests (TDD: written against the public contract before implementation)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // --- transliterate: ASCII passthrough -------------------------------

    #[test]
    fn ascii_is_unchanged() {
        assert_eq!(transliterate("Hello, World! 123", "?", "en"), "Hello, World! 123");
    }

    #[test]
    fn empty_string_stays_empty() {
        assert_eq!(transliterate("", "?", "en"), "");
        assert_eq!(remove_diacritics(""), "");
    }

    // --- transliterate: Latin-1 Supplement (bank x00) -------------------

    #[test]
    fn latin1_accented_uppercase() {
        // À Á Â Ã Ä Å -> A, Æ -> AE, Ç -> C
        assert_eq!(transliterate("ÀÁÂÃÄÅ", "?", "en"), "AAAAAA");
        assert_eq!(transliterate("Æ", "?", "en"), "AE");
        assert_eq!(transliterate("Ç", "?", "en"), "C");
    }

    #[test]
    fn latin1_accented_lowercase() {
        // é è ê ë -> e, ñ -> n, ü -> u, ß -> ss
        assert_eq!(transliterate("éèêë", "?", "en"), "eeee");
        assert_eq!(transliterate("ñ", "?", "en"), "n");
        assert_eq!(transliterate("ü", "?", "en"), "u");
        assert_eq!(transliterate("ß", "?", "en"), "ss");
    }

    #[test]
    fn latin1_symbols() {
        assert_eq!(transliterate("©", "?", "en"), "(C)");
        assert_eq!(transliterate("®", "?", "en"), "(R)");
        assert_eq!(transliterate("½", "?", "en"), " 1/2");
        assert_eq!(transliterate("°", "?", "en"), "deg");
    }

    #[test]
    fn full_word_example() {
        // Classic Drupal example.
        assert_eq!(transliterate("Über Œ", "?", "en"), "Uber OE");
    }

    // --- transliterate: Latin Extended-A (bank x01) ---------------------

    #[test]
    fn latin_extended_a() {
        assert_eq!(transliterate("Ā", "?", "en"), "A"); // U+0100
        assert_eq!(transliterate("ł", "?", "en"), "l"); // U+0142
        assert_eq!(transliterate("Œ", "?", "en"), "OE"); // U+0152
        assert_eq!(transliterate("ĳ", "?", "en"), "ij"); // U+0133
    }

    // --- transliterate: unknown substitution ----------------------------

    #[test]
    fn unknown_code_point_uses_substitute() {
        // U+4E2D (中) has no entry in the bundled banks.
        assert_eq!(transliterate("中", "?", "en"), "?");
        assert_eq!(transliterate("中", "_", "en"), "_");
        assert_eq!(transliterate("a中b", "?", "en"), "a?b");
    }

    #[test]
    fn control_chars_map_to_empty() {
        // C1 controls 0x80-0x9F map to empty string in Drupal's table.
        assert_eq!(transliterate("\u{0080}", "?", "en"), "");
        assert_eq!(transliterate("a\u{0085}b", "?", "en"), "ab");
    }

    // --- determinism -----------------------------------------------------

    #[test]
    fn transliteration_is_deterministic() {
        let input = "Crème Brûlée — Œuvre ½ ©";
        let a = transliterate(input, "?", "en");
        let b = transliterate(input, "?", "en");
        assert_eq!(a, b);
        assert_eq!(a, "Creme Brulee ? OEuvre  1/2 (C)");
    }

    // --- removeDiacritics ------------------------------------------------

    #[test]
    fn remove_diacritics_strips_accents() {
        assert_eq!(remove_diacritics("Crème Brûlée"), "Creme Brulee");
        assert_eq!(remove_diacritics("Über"), "Uber");
        assert_eq!(remove_diacritics("ñ"), "n");
    }

    #[test]
    fn remove_diacritics_keeps_non_accented() {
        // ASCII and non-letter symbols are untouched.
        assert_eq!(remove_diacritics("Hello! 123"), "Hello! 123");
        // © (0xA9) is below the accented range -> unchanged.
        assert_eq!(remove_diacritics("©"), "©");
    }

    #[test]
    fn remove_diacritics_honours_range1_exclusions() {
        // Ð (0x00D0) and × (0x00D7) are excluded -> left as-is.
        assert_eq!(remove_diacritics("\u{00D0}"), "\u{00D0}");
        assert_eq!(remove_diacritics("\u{00D7}"), "\u{00D7}");
        // ŋ (0x014B) is excluded.
        assert_eq!(remove_diacritics("\u{014B}"), "\u{014B}");
    }

    #[test]
    fn remove_diacritics_multichar_base_uses_fix_table() {
        // Ǣ (U+01E2) transliterates to "AE" (>1 char); removeDiacritics
        // should yield the base glyph Æ (U+00C6), not "AE".
        assert_eq!(remove_diacritics("\u{01E2}"), "\u{00C6}");
        // ǣ (U+01E3) -> æ
        assert_eq!(remove_diacritics("\u{01E3}"), "\u{00E6}");
    }

    #[test]
    fn remove_diacritics_is_deterministic() {
        let input = "Mëtàl Ümläut Ǣ";
        assert_eq!(remove_diacritics(input), remove_diacritics(input));
    }

    // --- multi-byte / mixed scripts -------------------------------------

    #[test]
    fn mixed_ascii_and_accented_and_unknown() {
        assert_eq!(transliterate("café 中 ©", "?", "en"), "cafe ? (C)");
    }
}
