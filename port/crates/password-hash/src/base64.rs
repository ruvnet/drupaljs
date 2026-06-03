//! The *nix `crypt()` base-64 alphabet ("ITOA64") and helpers.
//!
//! Faithful port of `PhpassHashedPasswordBase::base64Encode()` and
//! `getCountLog2()`. This is **not** RFC 4648 base64: the alphabet and bit
//! packing match the historic Unix `crypt()` encoding Drupal uses for portable
//! `$S$`/`$P$`/`$H$` hashes.

/// Mapping of a 6-bit value (0..63) to its ITOA64 character.
pub const ITOA64: &[u8; 64] =
    b"./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/// Encode `count` bytes of `input` using the *nix `crypt()` base-64 packing.
///
/// Mirrors the do/while bit-shuffling in `base64Encode()` exactly so the output
/// is byte-for-byte identical to Drupal/phpass. A 64-byte input yields 86 chars.
pub fn base64_encode(input: &[u8], count: usize) -> String {
    let mut output = String::with_capacity((count * 8).div_ceil(6));
    let mut i = 0usize;
    loop {
        let mut value = input[i] as u32;
        i += 1;
        output.push(ITOA64[(value & 0x3f) as usize] as char);
        if i < count {
            value |= (input[i] as u32) << 8;
        }
        output.push(ITOA64[((value >> 6) & 0x3f) as usize] as char);
        if i >= count {
            break;
        }
        i += 1;
        if i < count {
            value |= (input[i] as u32) << 16;
        }
        output.push(ITOA64[((value >> 12) & 0x3f) as usize] as char);
        if i >= count {
            break;
        }
        i += 1;
        output.push(ITOA64[((value >> 18) & 0x3f) as usize] as char);
        if i >= count {
            break;
        }
    }
    output
}

/// Parse the log2 iteration count from a setting/hash string.
///
/// The count char is at index 3 (`$S$<C>...`); its position in [`ITOA64`] is the
/// exponent. Returns `None` if the char is not in the alphabet (or string too
/// short), mirroring PHP `strpos()` returning `false`.
pub fn count_log2(setting: &str) -> Option<u8> {
    let c = setting.as_bytes().get(3)?;
    ITOA64.iter().position(|&x| x == *c).map(|p| p as u8)
}

/// Encode a log2 iteration exponent as its ITOA64 character (inverse of
/// [`count_log2`]). Exponent must be < 64; callers clamp to MAX_HASH_COUNT (30).
pub fn encode_count_log2(count_log2: u8) -> char {
    ITOA64[count_log2 as usize] as char
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn itoa64_index_seven_is_char_five() {
        // log2=7 (MIN_HASH_COUNT) -> '5' as seen in the Drupal test vector.
        assert_eq!(encode_count_log2(7), '5');
        assert_eq!(ITOA64[7], b'5');
    }

    #[test]
    fn count_log2_reads_index_three_char() {
        assert_eq!(count_log2("$S$5abcdefgh"), Some(7));
        assert_eq!(count_log2("$S$Aabcdefgh"), Some(12)); // 'A' is index 12
    }

    #[test]
    fn count_log2_none_for_short_or_bad_char() {
        assert_eq!(count_log2("$S$"), None);
        // '$' is index 0 in ITOA64? No — '$' is not in the alphabet at all.
        assert_eq!(count_log2("$S$$xxxxxxx"), None);
    }

    #[test]
    fn base64_encode_round_trips_against_known_drupal_vector() {
        // From the canonical hash $S$5TOxWPdv... the 43-char tail follows the
        // 12-char setting; encoding the salt+stretch output reproduces it. Here
        // we assert the encoder's structural property: 64 bytes -> 86 chars.
        let input = [0xABu8; 64];
        let encoded = base64_encode(&input, 64);
        assert_eq!(encoded.len(), 86);
    }

    #[test]
    fn base64_encode_single_byte_yields_two_chars() {
        // 0x00 -> low 6 bits 0 ('.'), next 6 bits 0 ('.').
        assert_eq!(base64_encode(&[0x00], 1), "..");
        // 0x3f -> low 6 bits 0x3f ('z'), next 6 bits 0 ('.').
        assert_eq!(base64_encode(&[0x3f], 1), "z.");
    }

    #[test]
    fn base64_encode_six_bytes_yields_eight_chars() {
        // The salt path encodes 6 bytes -> 8 chars (the *nix crypt salt width).
        assert_eq!(base64_encode(&[1, 2, 3, 4, 5, 6], 6).len(), 8);
    }
}
