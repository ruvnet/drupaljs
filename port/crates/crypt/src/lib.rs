//! `drupaljs-crypt` — port of Drupal's `Drupal\Component\Utility\Crypt`.
//!
//! Cryptographically-secure string helpers used across Drupal in
//! security-critical contexts (CSRF tokens, one-time login links, cache-key
//! salting). This crate mirrors the PHP API exactly:
//!
//! * [`hmac_base64`]  — HMAC-SHA256 of `data` under `key`, URL-safe base64,
//!   no padding (Drupal `Crypt::hmacBase64`).
//! * [`hash_base64`]  — SHA-256 of `data`, URL-safe base64, no padding
//!   (Drupal `Crypt::hashBase64`).
//! * [`random_bytes_base64`] — `n` CSPRNG bytes, URL-safe base64, no padding
//!   (Drupal `Crypt::randomBytesBase64`).
//! * [`hash_equals`] — constant-time byte comparison (PHP `hash_equals`, used
//!   by Drupal wherever a secret/MAC is verified).
//!
//! "URL-safe base64, no padding" is Drupal's `str_replace(['+','/','='],
//! ['-','_',''], …)`: standard base64 with `+`→`-`, `/`→`_`, and `=` padding
//! stripped — i.e. the `base64::URL_SAFE_NO_PAD` alphabet/config.
//!
//! Two surfaces are exposed: a plain-Rust API (for `rlib` consumers and
//! `cargo test`) and a `#[wasm_bindgen]` surface (for the owning TS package).
//! Native `cargo test` is the required correctness gate; `wasm-pack build`
//! produces the browser/Node artifact.

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine as _;
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;
use wasm_bindgen::prelude::*;

type HmacSha256 = Hmac<Sha256>;

// ---------------------------------------------------------------------------
// Plain-Rust API
// ---------------------------------------------------------------------------

/// Calculates a URL-safe, unpadded base64 HMAC-SHA256 of `data` under `key`.
///
/// Equivalent to Drupal `Crypt::hmacBase64($data, $key)`. The output is
/// deterministic for a given `(data, key)` pair and never empty, making it
/// safe for token comparison.
///
/// # Examples
/// ```no_run
/// let mac = drupaljs_crypt::hmac_base64(b"data", b"secret");
/// assert_eq!(mac, "GywWt1vSqHDBFBU8zaW8_KYzFLxyL6Fg1pDeEzzLuds");
/// ```
pub fn hmac_base64(data: &[u8], key: &[u8]) -> String {
    // `new_from_slice` only errors for fixed-size keys; HMAC accepts any key
    // length, so this is infallible here.
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC accepts any key length");
    mac.update(data);
    let digest = mac.finalize().into_bytes();
    URL_SAFE_NO_PAD.encode(digest)
}

/// Calculates a URL-safe, unpadded base64 SHA-256 hash of `data`.
///
/// Equivalent to Drupal `Crypt::hashBase64($data)`.
///
/// # Examples
/// ```no_run
/// let h = drupaljs_crypt::hash_base64(b"");
/// assert_eq!(h, "47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU");
/// ```
pub fn hash_base64(data: &[u8]) -> String {
    let digest = Sha256::digest(data);
    URL_SAFE_NO_PAD.encode(digest)
}

/// Returns a URL-safe, unpadded base64 string of `count` CSPRNG bytes.
///
/// Equivalent to Drupal `Crypt::randomBytesBase64($count)`. Uses the operating
/// system CSPRNG on native targets and the JS crypto API on `wasm32`. Two calls
/// with the same `count` return different values with overwhelming probability.
///
/// # Errors
/// Returns `Err` if the platform RNG is unavailable.
pub fn random_bytes_base64(count: usize) -> Result<String, getrandom::Error> {
    let mut buf = vec![0u8; count];
    getrandom::getrandom(&mut buf)?;
    Ok(URL_SAFE_NO_PAD.encode(buf))
}

/// Constant-time equality check of two byte slices.
///
/// Equivalent to PHP `hash_equals($a, $b)`: returns `false` immediately for
/// length mismatches, otherwise compares in time independent of the contents
/// to avoid leaking secret bytes via a timing side-channel.
///
/// # Examples
/// ```no_run
/// assert!(drupaljs_crypt::hash_equals(b"abc", b"abc"));
/// assert!(!drupaljs_crypt::hash_equals(b"abc", b"abd"));
/// assert!(!drupaljs_crypt::hash_equals(b"abc", b"ab"));
/// ```
pub fn hash_equals(a: &[u8], b: &[u8]) -> bool {
    // `ConstantTimeEq::ct_eq` requires equal lengths; a length mismatch is a
    // public fact (the lengths of MACs/hashes are not secret), so short-circuit.
    if a.len() != b.len() {
        return false;
    }
    a.ct_eq(b).into()
}

// ---------------------------------------------------------------------------
// wasm-bindgen surface
// ---------------------------------------------------------------------------

/// WASM entry for [`hmac_base64`]. `data`/`key` are JS `Uint8Array`.
#[wasm_bindgen(js_name = hmacBase64)]
pub fn hmac_base64_wasm(data: &[u8], key: &[u8]) -> String {
    hmac_base64(data, key)
}

/// WASM entry for [`hash_base64`]. `data` is a JS `Uint8Array`.
#[wasm_bindgen(js_name = hashBase64)]
pub fn hash_base64_wasm(data: &[u8]) -> String {
    hash_base64(data)
}

/// WASM entry for [`random_bytes_base64`]. Throws a JS error if the RNG fails.
#[wasm_bindgen(js_name = randomBytesBase64)]
pub fn random_bytes_base64_wasm(count: usize) -> Result<String, JsValue> {
    random_bytes_base64(count).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM entry for [`hash_equals`]. `a`/`b` are JS `Uint8Array`.
#[wasm_bindgen(js_name = hashEquals)]
pub fn hash_equals_wasm(a: &[u8], b: &[u8]) -> bool {
    hash_equals(a, b)
}

// ---------------------------------------------------------------------------
// Tests (TDD-London / known-answer; native `cargo test` is the gate)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // Known-answer vectors generated against the reference HMAC-SHA256 /
    // SHA-256 implementations with Drupal's URL-safe-no-pad transform applied
    // (`+`->`-`, `/`->`_`, `=` stripped). These pin byte-for-byte parity with
    // PHP `Crypt::hmacBase64` / `Crypt::hashBase64`.

    #[test]
    fn hmac_matches_drupal_vector() {
        assert_eq!(
            hmac_base64(b"The quick brown fox jumps over the lazy dog", b"key"),
            "97yD9DBThCSxMpjmqm-xQ-9NWaFJRhdZl0edvC0aPNg"
        );
        assert_eq!(
            hmac_base64(b"data", b"secret"),
            "GywWt1vSqHDBFBU8zaW8_KYzFLxyL6Fg1pDeEzzLuds"
        );
    }

    #[test]
    fn hmac_handles_empty_data_and_key() {
        // Security-critical: must never return an empty string.
        let mac = hmac_base64(b"", b"");
        assert_eq!(mac, "thNnmggU2ex3L5XXeMNfxf8Wl8STcVZTxscSFEKSxa0");
        assert!(!mac.is_empty());
    }

    #[test]
    fn hmac_is_url_safe_and_unpadded() {
        for (data, key) in [
            (&b"alpha"[..], &b"k1"[..]),
            (&b"beta gamma"[..], &b"another-key"[..]),
            (&b""[..], &b"x"[..]),
        ] {
            let mac = hmac_base64(data, key);
            assert!(!mac.contains('+'), "{mac} contains +");
            assert!(!mac.contains('/'), "{mac} contains /");
            assert!(!mac.contains('='), "{mac} contains =");
        }
    }

    #[test]
    fn hmac_differs_when_key_changes() {
        assert_ne!(hmac_base64(b"msg", b"key-a"), hmac_base64(b"msg", b"key-b"));
    }

    #[test]
    fn hash_matches_drupal_vectors() {
        assert_eq!(
            hash_base64(b""),
            "47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU"
        );
        assert_eq!(
            hash_base64(b"abc"),
            "ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0"
        );
        assert_eq!(
            hash_base64(b"The quick brown fox jumps over the lazy dog"),
            "16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI"
        );
    }

    #[test]
    fn hash_is_fixed_length_url_safe_unpadded() {
        // SHA-256 = 32 bytes -> 43 base64 chars without padding.
        let h = hash_base64(b"anything at all");
        assert_eq!(h.len(), 43);
        assert!(!h.contains('+') && !h.contains('/') && !h.contains('='));
    }

    #[test]
    fn random_bytes_base64_default_count_is_32_bytes() {
        let s = random_bytes_base64(32).expect("rng available");
        // 32 bytes -> ceil(32*8/6) = 43 unpadded base64 chars.
        assert_eq!(s.len(), 43);
        assert!(!s.contains('+') && !s.contains('/') && !s.contains('='));
    }

    #[test]
    fn random_bytes_base64_respects_count_and_decodes() {
        for count in [1usize, 8, 16, 31, 64] {
            let s = random_bytes_base64(count).expect("rng available");
            let decoded = URL_SAFE_NO_PAD.decode(&s).expect("valid base64");
            assert_eq!(decoded.len(), count, "count {count} round-trips");
        }
    }

    #[test]
    fn random_bytes_base64_zero_count_is_empty() {
        assert_eq!(random_bytes_base64(0).expect("rng available"), "");
    }

    #[test]
    fn random_bytes_base64_is_not_deterministic() {
        let a = random_bytes_base64(32).expect("rng available");
        let b = random_bytes_base64(32).expect("rng available");
        assert_ne!(a, b, "two CSPRNG draws should differ");
    }

    #[test]
    fn hash_equals_true_for_identical() {
        assert!(hash_equals(b"identical-secret", b"identical-secret"));
        assert!(hash_equals(b"", b""));
    }

    #[test]
    fn hash_equals_false_for_different_content_same_length() {
        assert!(!hash_equals(b"abcdef", b"abcdeg"));
        assert!(!hash_equals(b"\x00\x01", b"\x00\x02"));
    }

    #[test]
    fn hash_equals_false_for_length_mismatch() {
        assert!(!hash_equals(b"abc", b"ab"));
        assert!(!hash_equals(b"", b"x"));
        assert!(!hash_equals(b"longer string", b"short"));
    }

    #[test]
    fn hash_equals_validates_an_hmac_round_trip() {
        // Realistic usage: verify a freshly computed MAC.
        let mac = hmac_base64(b"payload", b"server-secret");
        let recomputed = hmac_base64(b"payload", b"server-secret");
        assert!(hash_equals(mac.as_bytes(), recomputed.as_bytes()));

        let forged = hmac_base64(b"payload", b"attacker-secret");
        assert!(!hash_equals(mac.as_bytes(), forged.as_bytes()));
    }
}
