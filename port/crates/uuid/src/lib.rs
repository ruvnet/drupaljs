//! `drupaljs-uuid` — RFC 4122 version 4 UUID generation + validation.
//!
//! Port of Drupal's `Drupal\Component\Uuid` machinery to Rust/WASM
//! (ADR-0015):
//!
//! * [`generate`] / [`generate_with`] — produce an RFC 4122 §4.4 v4 UUID,
//!   matching `Drupal\Component\Uuid\Php::generate()`. The 16 random bytes are
//!   sourced through the [`RandBytes`] hook so callers (and tests) can supply a
//!   deterministic byte source; production uses [`DefaultRng`].
//! * [`is_valid`] — lower-case UUID-format check, matching
//!   `Drupal\Component\Uuid\Uuid::isValid()` and its
//!   `[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}` pattern.
//!
//! Both expose a plain-Rust API (for `rlib` consumers and `cargo test`) and a
//! `#[wasm_bindgen]` surface (for the owning TS package). The native `cargo
//! test` suite is the required correctness gate.

use wasm_bindgen::prelude::*;

/// Pluggable source of 16 random bytes used to seed a v4 UUID.
///
/// This is the "seedable RNG hook": production code uses [`DefaultRng`], while
/// tests inject a fixed byte source ([`FixedBytes`]) to make
/// [`generate_with`] deterministic.
pub trait RandBytes {
    /// Fill `buf` with 16 (pseudo-)random bytes.
    fn fill(&mut self, buf: &mut [u8; 16]);
}

/// Default pseudo-random byte source.
///
/// A small self-seeding xorshift128+-style generator. It is seeded from a
/// process-wide atomic counter mixed with a monotonic-ish clock read so that
/// distinct [`DefaultRng::new`] instances diverge. For cryptographically strong
/// UUIDs the consuming WASM layer should prefer the host CSPRNG; this keeps the
/// crate dependency-free while remaining well-distributed for ID generation.
pub struct DefaultRng {
    s0: u64,
    s1: u64,
}

impl DefaultRng {
    /// Create a freshly-seeded generator.
    pub fn new() -> Self {
        use core::sync::atomic::{AtomicU64, Ordering};
        static COUNTER: AtomicU64 = AtomicU64::new(0x9E37_79B9_7F4A_7C15);
        let n = COUNTER.fetch_add(0x9E37_79B9_7F4A_7C15, Ordering::Relaxed);
        let seed = n ^ Self::clock_entropy();
        Self::from_seed(seed)
    }

    /// Deterministically seed the generator from a single 64-bit value.
    pub fn from_seed(seed: u64) -> Self {
        // SplitMix64 to expand one seed into two non-zero state words.
        let mut z = seed.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut next = || {
            z = z.wrapping_add(0x9E37_79B9_7F4A_7C15);
            let mut x = z;
            x = (x ^ (x >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
            x = (x ^ (x >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
            x ^ (x >> 31)
        };
        let s0 = next();
        let s1 = next();
        DefaultRng {
            s0: if s0 == 0 { 1 } else { s0 },
            s1: if s1 == 0 { 2 } else { s1 },
        }
    }

    #[cfg(not(target_arch = "wasm32"))]
    fn clock_entropy() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0)
    }

    #[cfg(target_arch = "wasm32")]
    fn clock_entropy() -> u64 {
        // No std clock on the WASM target; the process-wide atomic counter in
        // `new()` already guarantees per-instance divergence. The consuming TS
        // package is expected to drive `generateSeeded` from host entropy
        // (e.g. `crypto.getRandomValues`) when CSPRNG-grade IDs are required.
        0x1234_5678_9ABC_DEF0
    }

    fn next_u64(&mut self) -> u64 {
        // xorshift128+
        let mut x = self.s0;
        let y = self.s1;
        self.s0 = y;
        x ^= x << 23;
        x ^= x >> 17;
        x ^= y ^ (y >> 26);
        self.s1 = x;
        x.wrapping_add(y)
    }
}

impl Default for DefaultRng {
    fn default() -> Self {
        Self::new()
    }
}

impl RandBytes for DefaultRng {
    fn fill(&mut self, buf: &mut [u8; 16]) {
        let lo = self.next_u64().to_le_bytes();
        let hi = self.next_u64().to_le_bytes();
        buf[..8].copy_from_slice(&lo);
        buf[8..].copy_from_slice(&hi);
    }
}

/// A fixed, deterministic byte source — the test/seeding hook.
///
/// Always yields the same 16 bytes, so `generate_with(&mut FixedBytes(..))`
/// produces a known UUID. Useful for golden tests and for callers that already
/// hold entropy from elsewhere.
pub struct FixedBytes(pub [u8; 16]);

impl RandBytes for FixedBytes {
    fn fill(&mut self, buf: &mut [u8; 16]) {
        *buf = self.0;
    }
}

/// Lay out 16 raw bytes as an RFC 4122 §4.4 version-4 UUID string.
///
/// This is the pure core shared by every generator path. It mirrors
/// `Drupal\Component\Uuid\Php::generate()` exactly:
///
/// * the high nibble of byte 6 (the `time_hi_and_version` field) is forced to
///   `0b0100` (version 4);
/// * the top two bits of byte 8 (`clock_seq_hi_and_reserved`) are set to
///   `0b10` (the RFC 4122 variant) via `& 0x3F | 0x80`.
///
/// Output is always lower-case and 36 characters (`8-4-4-4-12`).
pub fn format_v4(mut bytes: [u8; 16]) -> String {
    // Version 4: high nibble of byte 6 == 0100.
    bytes[6] = (bytes[6] & 0x0F) | 0x40;
    // Variant 10xx: top two bits of byte 8.
    bytes[8] = (bytes[8] & 0x3F) | 0x80;

    let mut out = String::with_capacity(36);
    for (i, b) in bytes.iter().enumerate() {
        if i == 4 || i == 6 || i == 8 || i == 10 {
            out.push('-');
        }
        push_hex_byte(&mut out, *b);
    }
    out
}

#[inline]
fn push_hex_byte(out: &mut String, b: u8) {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    out.push(HEX[(b >> 4) as usize] as char);
    out.push(HEX[(b & 0x0F) as usize] as char);
}

/// Generate a v4 UUID using the supplied byte source (the seedable hook).
///
/// Deterministic for a deterministic `rng`; this is the testable entry point.
pub fn generate_with<R: RandBytes>(rng: &mut R) -> String {
    let mut bytes = [0u8; 16];
    rng.fill(&mut bytes);
    format_v4(bytes)
}

/// Generate a v4 UUID using the default (self-seeding) RNG.
///
/// Equivalent to `(new Php())->generate()` in Drupal.
pub fn generate() -> String {
    generate_with(&mut DefaultRng::new())
}

/// Check that `uuid` is a well-formed lower-case UUID.
///
/// Matches Drupal's `Uuid::isValid()` pattern
/// `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` without a regex engine:
/// validates the `8-4-4-4-12` group layout and that every non-dash character is
/// a lower-case hex digit.
pub fn is_valid(uuid: &str) -> bool {
    const GROUPS: [usize; 5] = [8, 4, 4, 4, 12];
    let bytes = uuid.as_bytes();
    let mut pos = 0usize;
    for (gi, &len) in GROUPS.iter().enumerate() {
        if gi > 0 {
            if bytes.get(pos) != Some(&b'-') {
                return false;
            }
            pos += 1;
        }
        for _ in 0..len {
            match bytes.get(pos) {
                Some(&c) if is_lower_hex(c) => pos += 1,
                _ => return false,
            }
        }
    }
    // Reject anything trailing (the PHP regex is anchored at both ends).
    pos == bytes.len()
}

#[inline]
fn is_lower_hex(c: u8) -> bool {
    matches!(c, b'0'..=b'9' | b'a'..=b'f')
}

// ---------------------------------------------------------------------------
// WASM boundary — thin adapters over the plain-Rust API above.
// ---------------------------------------------------------------------------

/// WASM entry: generate a v4 UUID using the default RNG.
#[wasm_bindgen(js_name = generate)]
pub fn generate_wasm() -> String {
    generate()
}

/// WASM entry: generate a v4 UUID from a caller-supplied 64-bit seed.
///
/// Lets the JS layer drive a deterministic generator (testing / reproducible
/// fixtures) without exposing the trait machinery across the boundary.
#[wasm_bindgen(js_name = generateSeeded)]
pub fn generate_seeded_wasm(seed: u64) -> String {
    generate_with(&mut DefaultRng::from_seed(seed))
}

/// WASM entry: validate a UUID string (`Uuid.isValid`).
#[wasm_bindgen(js_name = isValid)]
pub fn is_valid_wasm(uuid: &str) -> bool {
    is_valid(uuid)
}

#[cfg(test)]
mod tests {
    //! TDD-London contract tests for the public crate surface. Collaborators
    //! (the RNG) are injected via the [`RandBytes`] hook so generation is
    //! deterministic and we assert the exact RFC 4122 §4.4 / Drupal contract.
    use super::*;

    /// Bytes 0x00..=0x0F, a convenient known input.
    fn ramp() -> FixedBytes {
        let mut b = [0u8; 16];
        for (i, x) in b.iter_mut().enumerate() {
            *x = i as u8;
        }
        FixedBytes(b)
    }

    #[test]
    fn generate_with_is_deterministic_for_fixed_source() {
        let a = generate_with(&mut ramp());
        let b = generate_with(&mut ramp());
        assert_eq!(a, b, "same byte source must yield same UUID");
    }

    #[test]
    fn generate_with_known_bytes_matches_golden() {
        // Raw ramp 00..0f, with version nibble forced to 4 (byte 6: 06 -> 46)
        // and variant bits forced on (byte 8: 08 -> 88).
        let uuid = generate_with(&mut ramp());
        assert_eq!(uuid, "00010203-0405-4607-8809-0a0b0c0d0e0f");
    }

    #[test]
    fn generated_uuid_is_36_chars_with_dashes_at_canonical_positions() {
        let uuid = generate_with(&mut ramp());
        assert_eq!(uuid.len(), 36);
        let dashes: Vec<usize> = uuid
            .char_indices()
            .filter(|(_, c)| *c == '-')
            .map(|(i, _)| i)
            .collect();
        assert_eq!(dashes, vec![8, 13, 18, 23]);
    }

    #[test]
    fn version_nibble_is_4() {
        // Char index 14 is the first hex digit of the 3rd group
        // (time_hi_and_version high nibble) — must be '4' for v4.
        let uuid = generate_with(&mut FixedBytes([0xFF; 16]));
        let nibble = uuid.chars().nth(14).unwrap();
        assert_eq!(nibble, '4');
    }

    #[test]
    fn variant_nibble_is_8_9_a_or_b() {
        // Char index 19 (first hex of 4th group) carries the variant bits.
        for fill in [0x00u8, 0x55, 0xAA, 0xFF] {
            let uuid = generate_with(&mut FixedBytes([fill; 16]));
            let nibble = uuid.chars().nth(19).unwrap();
            assert!(
                matches!(nibble, '8' | '9' | 'a' | 'b'),
                "variant nibble {nibble} out of RFC 4122 range for fill {fill:#x}"
            );
        }
    }

    #[test]
    fn generated_uuid_is_always_valid_and_lowercase() {
        for fill in 0u8..=255 {
            let uuid = generate_with(&mut FixedBytes([fill; 16]));
            assert!(is_valid(&uuid), "generated {uuid} should be valid");
            assert_eq!(uuid, uuid.to_lowercase(), "{uuid} must be lower-case");
        }
    }

    #[test]
    fn default_rng_generates_valid_distinct_uuids() {
        let a = generate();
        let b = generate();
        assert!(is_valid(&a));
        assert!(is_valid(&b));
        assert_ne!(a, b, "default RNG should not repeat across calls");
    }

    #[test]
    fn from_seed_is_reproducible() {
        let a = generate_with(&mut DefaultRng::from_seed(42));
        let b = generate_with(&mut DefaultRng::from_seed(42));
        assert_eq!(a, b);
        assert!(is_valid(&a));
        let c = generate_with(&mut DefaultRng::from_seed(43));
        assert_ne!(a, c, "different seeds should differ");
    }

    #[test]
    fn is_valid_accepts_canonical_lowercase_uuid() {
        assert!(is_valid("00010203-0405-4607-8809-0a0b0c0d0e0f"));
        assert!(is_valid("6ba7b810-9dad-11d1-80b4-00c04fd430c8"));
    }

    #[test]
    fn is_valid_rejects_uppercase() {
        // Drupal's pattern only accepts lower-case hex.
        assert!(!is_valid("6BA7B810-9DAD-11D1-80B4-00C04FD430C8"));
    }

    #[test]
    fn is_valid_rejects_malformed() {
        assert!(!is_valid(""));
        assert!(!is_valid("not-a-uuid"));
        assert!(!is_valid("00010203-0405-4607-8809-0a0b0c0d0e0")); // 11 in last
        assert!(!is_valid("00010203-0405-4607-8809-0a0b0c0d0e0ff")); // 13 in last
        assert!(!is_valid("000102030405460788090a0b0c0d0e0f")); // no dashes
        assert!(!is_valid("00010203_0405_4607_8809_0a0b0c0d0e0f")); // wrong sep
        assert!(!is_valid("g0010203-0405-4607-8809-0a0b0c0d0e0f")); // non-hex
        // Trailing/leading junk (anchors).
        assert!(!is_valid(" 00010203-0405-4607-8809-0a0b0c0d0e0f"));
        assert!(!is_valid("00010203-0405-4607-8809-0a0b0c0d0e0f "));
    }

    #[test]
    fn format_v4_forces_version_and_variant_bits() {
        let s = format_v4([0u8; 16]);
        let bytes = s.as_bytes();
        // Group 3 first char (index 14) == version.
        assert_eq!(bytes[14], b'4');
        // Group 4 first char (index 19) variant high bits -> 0x8 nibble.
        assert_eq!(bytes[19], b'8');
    }
}
