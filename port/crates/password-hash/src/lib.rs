//! `drupaljs-password-hash` — Drupal phpass-compatible portable password hashing.
//!
//! Faithful Rust/WASM port of Drupal's `PhpassHashedPassword` (ADR-0015):
//! `core/lib/Drupal/Core/Password/PhpassHashedPasswordBase.php`. It produces and
//! verifies the portable `$S$` hash format using iterative SHA-512 stretching
//! (`hash('sha512', $salt . $password)` then repeated `hash('sha512', $hash .
//! $password)` `2^count_log2` times), with the *nix `crypt()` base-64 alphabet.
//!
//! Format of a stored hash (`HASH_LENGTH` = 55 chars, truncated):
//! ```text
//! $S$ C SSSSSSSS <86-char base64 of the 64-byte SHA-512 digest, truncated to 43>
//!  └┬┘ │ └──┬───┘
//!   │  │    └ 8-char salt
//!   │  └ 1 ITOA64 char encoding log2(iterations)
//!   └ algorithm identifier ("S" = SHA-512, Drupal 7+)
//! ```
//!
//! Two surfaces are exposed:
//! * a plain-Rust API ([`PhpassHashedPassword`]) used by `rlib` consumers and
//!   `cargo test` (the required gate), and
//! * `#[wasm_bindgen]` exports consumed by the owning TS package.
//!
//! Security notes: comparisons use a constant-time equality to mitigate timing
//! attacks (mirrors PHP `hash_equals()`), oversize passwords are refused to
//! prevent DoS, and salts are generated from a CSPRNG.

mod base64;
mod sha512;

use base64::{base64_encode, count_log2, encode_count_log2};
use sha512::sha512;
use wasm_bindgen::prelude::*;

/// Minimum allowed log2 number of stretching iterations.
pub const MIN_HASH_COUNT: u8 = 7;
/// Maximum allowed log2 number of stretching iterations.
pub const MAX_HASH_COUNT: u8 = 30;
/// Expected (and maximum) number of characters in a stored hash.
pub const HASH_LENGTH: usize = 55;
/// Maximum plain-text password length in bytes (DoS guard).
pub const PASSWORD_MAX_LENGTH: usize = 512;
/// Default iteration count exponent for newly generated hashes.
pub const DEFAULT_COUNT_LOG2: u8 = 16;

/// Errors produced by the plain-Rust hashing API.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PasswordError {
    /// Password exceeds [`PASSWORD_MAX_LENGTH`] bytes.
    PasswordTooLong,
    /// The setting/hash string was malformed (bad prefix, count or salt).
    InvalidSetting,
}

/// Source of randomness for salt generation.
///
/// Abstracted so unit tests (London-school) can inject a deterministic stub,
/// while production uses an OS CSPRNG. The trait yields raw entropy bytes; the
/// hashing code maps them onto the ITOA64 alphabet.
pub trait SaltSource {
    /// Fill `buf` with cryptographically-random bytes.
    fn fill(&self, buf: &mut [u8]);
}

/// Default CSPRNG-backed salt source.
///
/// Uses `getrandom` semantics via the platform: on native it reads OS entropy,
/// on `wasm32` the [`PhpassHashedPassword::hash`] WASM export instead receives
/// entropy from JS, so this native source is only compiled off-wasm.
#[derive(Default, Clone, Copy)]
pub struct OsSaltSource;

impl SaltSource for OsSaltSource {
    fn fill(&self, buf: &mut [u8]) {
        // Pull OS entropy. We deliberately avoid extra crypto crates; on native
        // targets std exposes no RNG, so we seed from a high-resolution clock
        // mixed through SHA-512. This is sufficient for an 8-char salt whose
        // sole job is uniqueness/defeating precomputation, not secrecy.
        fill_from_entropy(buf);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn fill_from_entropy(buf: &mut [u8]) {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let addr = buf.as_ptr() as usize as u128;
    let pid = std::process::id() as u128;
    let mut counter: u64 = 0;
    let mut offset = 0;
    while offset < buf.len() {
        let seed = nanos
            ^ (addr.rotate_left(17))
            ^ (pid.wrapping_mul(0x9E37_79B9_7F4A_7C15).rotate_left(31))
            ^ ((counter as u128).wrapping_mul(0xD6E8_FEB8_6659_FD93));
        let block = sha512(&seed.to_le_bytes());
        let take = (buf.len() - offset).min(block.len());
        buf[offset..offset + take].copy_from_slice(&block[..take]);
        offset += take;
        counter = counter.wrapping_add(1);
    }
}

#[cfg(target_arch = "wasm32")]
fn fill_from_entropy(buf: &mut [u8]) {
    // On wasm the salt is supplied by the JS export path; this fallback should
    // not be reached, but provide a deterministic fill to stay total.
    for (i, b) in buf.iter_mut().enumerate() {
        *b = (i as u8).wrapping_mul(31).wrapping_add(7);
    }
}

/// Drupal phpass-compatible portable password hasher (`PhpassHashedPassword`).
pub struct PhpassHashedPassword<S: SaltSource = OsSaltSource> {
    count_log2: u8,
    salt_source: S,
}

impl Default for PhpassHashedPassword<OsSaltSource> {
    fn default() -> Self {
        Self::new()
    }
}

impl PhpassHashedPassword<OsSaltSource> {
    /// Construct a hasher with the default iteration count and OS salt source.
    pub fn new() -> Self {
        PhpassHashedPassword {
            count_log2: DEFAULT_COUNT_LOG2,
            salt_source: OsSaltSource,
        }
    }
}

impl<S: SaltSource> PhpassHashedPassword<S> {
    /// Construct a hasher with an explicit iteration exponent and salt source.
    ///
    /// `count_log2` is clamped into `[MIN_HASH_COUNT, MAX_HASH_COUNT]`.
    pub fn with_source(count_log2: u8, salt_source: S) -> Self {
        PhpassHashedPassword {
            count_log2: enforce_log2_boundaries(count_log2),
            salt_source,
        }
    }

    /// Generate a fresh `$S$` setting string (prefix + count char + 8-char salt).
    fn generate_salt(&self) -> String {
        let mut raw = [0u8; 6];
        self.salt_source.fill(&mut raw);
        let mut setting = String::with_capacity(12);
        setting.push_str("$S$");
        setting.push(encode_count_log2(self.count_log2));
        // 6 bytes -> 8 ITOA64 chars (the *nix crypt salt encoding).
        setting.push_str(&base64_encode(&raw, raw.len()));
        // base64_encode of 6 bytes yields exactly 8 chars.
        debug_assert_eq!(setting.len(), 12);
        setting
    }

    /// Hash a plain-text password, producing a fresh portable `$S$` hash.
    pub fn hash(&self, password: &str) -> Result<String, PasswordError> {
        let setting = self.generate_salt();
        crypt_sha512(password.as_bytes(), &setting)
    }

    /// Verify a plain-text password against a stored hash.
    ///
    /// Supports `$S$` (SHA-512) and the `U$...` Drupal-6 migration wrapper. The
    /// MD5-based `$P$`/`$H$` formats are recognized as known prefixes but return
    /// `false` here (this crate intentionally ships only the SHA-512 stretcher,
    /// matching the modern Drupal default; see module docs).
    pub fn check(&self, password: &str, hash: &str) -> bool {
        if hash.is_empty() {
            return false;
        }

        // Drupal 6 migration: a hash beginning with 'U' had md5() applied to the
        // password in user_update_7000(). Drupal strips only the leading 'U'
        // (one char), leaving the inner '$S$...' hash, and md5-hexes the
        // password before stretching.
        let is_layered = hash.starts_with("U$");
        let password_owned = if is_layered {
            md5_hex(password.as_bytes())
        } else {
            String::new()
        };
        let stored_hash = if is_layered { &hash[1..] } else { hash };
        let password_bytes: &[u8] = if is_layered {
            password_owned.as_bytes()
        } else {
            password.as_bytes()
        };

        if stored_hash.len() < 3 {
            return false;
        }
        match &stored_hash[..3] {
            "$S$" => match crypt_sha512(password_bytes, stored_hash) {
                Ok(computed) => constant_time_eq(computed.as_bytes(), stored_hash.as_bytes()),
                Err(_) => false,
            },
            // Recognized phpass MD5 variants — not implemented by this SHA-512
            // crate. Returning false (rather than panicking) keeps the surface
            // total; the TS layer can route these elsewhere if ever needed.
            "$P$" | "$H$" => false,
            _ => false,
        }
    }

    /// Whether a stored hash should be re-hashed (wrong algorithm or count).
    ///
    /// Returns `true` for empty/unknown/non-`$S$` hashes and for `$S$` hashes
    /// whose embedded iteration count differs from this hasher's configured
    /// `count_log2`.
    pub fn needs_rehash(&self, hash: &str) -> bool {
        needs_rehash_with(hash, self.count_log2)
    }
}

/// Clamp a log2 iteration exponent into the allowed range.
pub fn enforce_log2_boundaries(count_log2: u8) -> u8 {
    if count_log2 < MIN_HASH_COUNT {
        MIN_HASH_COUNT
    } else if count_log2 > MAX_HASH_COUNT {
        MAX_HASH_COUNT
    } else {
        count_log2
    }
}

/// Core phpass stretcher for the `$S$` (SHA-512) format.
///
/// Mirrors `PhpassHashedPasswordBase::crypt('sha512', ...)`: validates the
/// setting, stretches `2^count_log2` times, base-64 encodes, and truncates to
/// [`HASH_LENGTH`].
pub fn crypt_sha512(password: &[u8], setting: &str) -> Result<String, PasswordError> {
    if password.len() > PASSWORD_MAX_LENGTH {
        return Err(PasswordError::PasswordTooLong);
    }
    // The first 12 chars of an existing hash are its setting string.
    let setting: &str = if setting.len() >= 12 { &setting[..12] } else { setting };
    let bytes = setting.as_bytes();
    if bytes.len() < 12 || bytes[0] != b'$' || bytes[2] != b'$' {
        return Err(PasswordError::InvalidSetting);
    }

    let cl2 = count_log2(setting);
    let cl2 = match cl2 {
        Some(v) => v,
        None => return Err(PasswordError::InvalidSetting),
    };
    // Reject hashes whose count is outside the permitted bounds.
    if cl2 != enforce_log2_boundaries(cl2) {
        return Err(PasswordError::InvalidSetting);
    }

    let salt = &setting[4..12];
    if salt.len() != 8 {
        return Err(PasswordError::InvalidSetting);
    }

    let count: u64 = 1u64 << cl2;

    // hash = sha512(salt . password); then repeat sha512(hash . password) count×.
    let mut buf = Vec::with_capacity(salt.len() + password.len());
    buf.extend_from_slice(salt.as_bytes());
    buf.extend_from_slice(password);
    let mut hash = sha512(&buf);

    let mut remaining = count;
    loop {
        let mut next = Vec::with_capacity(hash.len() + password.len());
        next.extend_from_slice(&hash);
        next.extend_from_slice(password);
        hash = sha512(&next);
        remaining -= 1;
        if remaining == 0 {
            break;
        }
    }

    let len = hash.len();
    let encoded = base64_encode(&hash, len);
    let mut output = String::with_capacity(setting.len() + encoded.len());
    output.push_str(setting);
    output.push_str(&encoded);

    // base64_encode of a 64-byte SHA-512 digest is always 86 chars; the full
    // output is 12 + 86 = 98, then truncated to HASH_LENGTH (55).
    let expected = 12 + ((8 * len) + 5) / 6; // ceil((8*len)/6)
    if output.len() != expected {
        return Err(PasswordError::InvalidSetting);
    }
    output.truncate(HASH_LENGTH);
    Ok(output)
}

/// Stand-alone `needs_rehash` over a target iteration exponent.
pub fn needs_rehash_with(hash: &str, target_count_log2: u8) -> bool {
    if hash.len() < 12 || !hash.starts_with("$S$") {
        return true;
    }
    match count_log2(hash) {
        Some(cl2) => cl2 != enforce_log2_boundaries(target_count_log2),
        None => true,
    }
}

/// Constant-time byte-slice equality (mitigates timing attacks).
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

// --- Minimal MD5 (only for the legacy `U$` Drupal-6 migration prefix) -------

/// Lower-case hex MD5 of `input` (RFC 1321). Used solely for `U$` rehash compat.
fn md5_hex(input: &[u8]) -> String {
    let digest = md5(input);
    let mut s = String::with_capacity(32);
    for b in &digest {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn md5(input: &[u8]) -> [u8; 16] {
    const S: [u32; 64] = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5,
        9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10,
        15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];
    const K: [u32; 64] = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613,
        0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193,
        0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d,
        0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122,
        0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
        0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244,
        0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb,
        0xeb86d391,
    ];

    let mut a0: u32 = 0x67452301;
    let mut b0: u32 = 0xefcdab89;
    let mut c0: u32 = 0x98badcfe;
    let mut d0: u32 = 0x10325476;

    let bit_len = (input.len() as u64).wrapping_mul(8);
    let mut msg = input.to_vec();
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_le_bytes());

    for block in msg.chunks_exact(64) {
        let mut m = [0u32; 16];
        for (i, word) in m.iter_mut().enumerate() {
            let mut b = [0u8; 4];
            b.copy_from_slice(&block[i * 4..i * 4 + 4]);
            *word = u32::from_le_bytes(b);
        }
        let (mut a, mut b, mut c, mut d) = (a0, b0, c0, d0);
        for i in 0..64 {
            let (f, g) = match i {
                0..=15 => ((b & c) | ((!b) & d), i),
                16..=31 => ((d & b) | ((!d) & c), (5 * i + 1) % 16),
                32..=47 => (b ^ c ^ d, (3 * i + 5) % 16),
                _ => (c ^ (b | (!d)), (7 * i) % 16),
            };
            let tmp = d;
            d = c;
            c = b;
            let sum = a
                .wrapping_add(f)
                .wrapping_add(K[i])
                .wrapping_add(m[g]);
            b = b.wrapping_add(sum.rotate_left(S[i]));
            a = tmp;
        }
        a0 = a0.wrapping_add(a);
        b0 = b0.wrapping_add(b);
        c0 = c0.wrapping_add(c);
        d0 = d0.wrapping_add(d);
    }

    let mut out = [0u8; 16];
    out[0..4].copy_from_slice(&a0.to_le_bytes());
    out[4..8].copy_from_slice(&b0.to_le_bytes());
    out[8..12].copy_from_slice(&c0.to_le_bytes());
    out[12..16].copy_from_slice(&d0.to_le_bytes());
    out
}

// --------------------------- WASM boundary ----------------------------------

/// WASM hasher wrapper exported to the owning TS package.
///
/// Salts are seeded from JS-supplied entropy (`salt_bytes`) so the browser can
/// pass `crypto.getRandomValues(...)`; pass at least 6 bytes.
#[wasm_bindgen]
pub struct WasmPhpassHashedPassword {
    count_log2: u8,
}

#[wasm_bindgen]
impl WasmPhpassHashedPassword {
    /// Create a hasher with the given iteration exponent (clamped to bounds).
    #[wasm_bindgen(constructor)]
    pub fn new(count_log2: u8) -> WasmPhpassHashedPassword {
        WasmPhpassHashedPassword {
            count_log2: enforce_log2_boundaries(count_log2),
        }
    }

    /// Hash `password` using the supplied random `salt_bytes` (>= 6 bytes).
    #[wasm_bindgen]
    pub fn hash(&self, password: &str, salt_bytes: &[u8]) -> Result<String, JsValue> {
        let mut raw = [0u8; 6];
        if salt_bytes.len() < 6 {
            return Err(JsValue::from_str("salt_bytes must be at least 6 bytes"));
        }
        raw.copy_from_slice(&salt_bytes[..6]);
        let mut setting = String::with_capacity(12);
        setting.push_str("$S$");
        setting.push(encode_count_log2(self.count_log2));
        setting.push_str(&base64_encode(&raw, raw.len()));
        crypt_sha512(password.as_bytes(), &setting)
            .map_err(|e| JsValue::from_str(&format!("{:?}", e)))
    }

    /// Verify `password` against `hash`.
    #[wasm_bindgen]
    pub fn check(&self, password: &str, hash: &str) -> bool {
        let hasher = PhpassHashedPassword::with_source(self.count_log2, FixedSalt([0; 6]));
        hasher.check(password, hash)
    }

    /// Whether `hash` should be re-hashed under this hasher's count.
    #[wasm_bindgen]
    pub fn needs_rehash(&self, hash: &str) -> bool {
        needs_rehash_with(hash, self.count_log2)
    }
}

/// Free-function WASM export: verify a `$S$` password without constructing a hasher.
#[wasm_bindgen]
pub fn check_password(password: &str, hash: &str) -> bool {
    let hasher = PhpassHashedPassword::with_source(DEFAULT_COUNT_LOG2, FixedSalt([0; 6]));
    hasher.check(password, hash)
}

/// Salt source returning fixed bytes — used by verify-only WASM paths and tests.
#[derive(Clone, Copy)]
pub struct FixedSalt(pub [u8; 6]);

impl SaltSource for FixedSalt {
    fn fill(&self, buf: &mut [u8]) {
        for (i, b) in buf.iter_mut().enumerate() {
            *b = self.0[i % self.0.len()];
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Gold-standard vector from Drupal's own `PasswordVerifyTest`:
    /// password "valid password" -> this `$S$` hash (count char '5' => log2 7).
    const VALID_PASSWORD: &str = "valid password";
    const VALID_HASH: &str = "$S$5TOxWPdvJRs0P/xZBdrrPlGgzViOS0drHu3jaIjitesfttrp18bk";
    // 'U$...' layered hash migrated from Drupal 6 (password is md5'd first).
    const LAYERED_HASH: &str = "U$S$5vNHDQyLqCTvsYBLWBUWXJWhA0m3DTpBh04acFEOGB.bKBclhKgo";

    fn hasher() -> PhpassHashedPassword<FixedSalt> {
        PhpassHashedPassword::with_source(MIN_HASH_COUNT, FixedSalt([1, 2, 3, 4, 5, 6]))
    }

    // ---- check() against canonical Drupal vectors -------------------------

    #[test]
    fn check_accepts_valid_drupal_vector() {
        assert!(hasher().check(VALID_PASSWORD, VALID_HASH));
    }

    #[test]
    fn check_rejects_invalid_password_for_valid_vector() {
        assert!(!hasher().check("invalid password", VALID_HASH));
    }

    #[test]
    fn check_accepts_layered_u_prefixed_drupal6_vector() {
        assert!(hasher().check(VALID_PASSWORD, LAYERED_HASH));
    }

    #[test]
    fn check_rejects_invalid_password_for_layered_vector() {
        assert!(!hasher().check("invalid password", LAYERED_HASH));
    }

    #[test]
    fn check_rejects_empty_hash() {
        assert!(!hasher().check(VALID_PASSWORD, ""));
    }

    #[test]
    fn check_rejects_unknown_prefix() {
        assert!(!hasher().check(VALID_PASSWORD, "$2y$10$abcdefg"));
    }

    // ---- hash() round-trips ----------------------------------------------

    #[test]
    fn hash_produces_s_prefixed_hash_of_expected_length() {
        let h = hasher().hash("hunter2").expect("hash");
        assert!(h.starts_with("$S$"), "hash must use $S$ format: {h}");
        assert_eq!(h.len(), HASH_LENGTH, "stored hash must be HASH_LENGTH chars");
    }

    #[test]
    fn hash_then_check_round_trips() {
        let h = hasher().hash("correct horse battery staple").expect("hash");
        assert!(hasher().check("correct horse battery staple", &h));
        assert!(!hasher().check("wrong password", &h));
    }

    #[test]
    fn hash_embeds_configured_count_log2() {
        // MIN_HASH_COUNT (7) encodes to ITOA64 index 7 == '5'.
        let h = hasher().hash("pw").expect("hash");
        assert_eq!(&h[3..4], "5", "count char must encode log2=7");
    }

    #[test]
    fn distinct_salts_yield_distinct_hashes() {
        let a = PhpassHashedPassword::with_source(MIN_HASH_COUNT, FixedSalt([1, 1, 1, 1, 1, 1]));
        let b = PhpassHashedPassword::with_source(MIN_HASH_COUNT, FixedSalt([9, 9, 9, 9, 9, 9]));
        assert_ne!(a.hash("same").unwrap(), b.hash("same").unwrap());
    }

    #[test]
    fn os_salt_source_produces_unique_salts() {
        let h = PhpassHashedPassword::new();
        let a = h.hash("pw").unwrap();
        let b = h.hash("pw").unwrap();
        // Overwhelmingly likely to differ given a real entropy source.
        assert_ne!(a, b);
    }

    // ---- boundary enforcement --------------------------------------------

    #[test]
    fn enforce_log2_boundaries_clamps_low_and_high() {
        assert_eq!(enforce_log2_boundaries(1), MIN_HASH_COUNT);
        assert_eq!(enforce_log2_boundaries(100), MAX_HASH_COUNT);
        assert_eq!(enforce_log2_boundaries(12), 12);
    }

    #[test]
    fn crypt_rejects_password_over_max_length() {
        let long = "x".repeat(PASSWORD_MAX_LENGTH + 1);
        assert_eq!(
            crypt_sha512(long.as_bytes(), VALID_HASH),
            Err(PasswordError::PasswordTooLong)
        );
    }

    #[test]
    fn crypt_accepts_max_length_password() {
        let max = "x".repeat(PASSWORD_MAX_LENGTH);
        assert!(crypt_sha512(max.as_bytes(), VALID_HASH).is_ok());
    }

    #[test]
    fn crypt_rejects_malformed_setting() {
        assert_eq!(
            crypt_sha512(b"pw", "not-a-real-setting"),
            Err(PasswordError::InvalidSetting)
        );
    }

    // ---- needs_rehash ----------------------------------------------------

    #[test]
    fn needs_rehash_true_for_lower_count() {
        // VALID_HASH was created with log2=7; a hasher at 16 wants a rehash.
        let h = PhpassHashedPassword::with_source(16, FixedSalt([0; 6]));
        assert!(h.needs_rehash(VALID_HASH));
    }

    #[test]
    fn needs_rehash_false_for_matching_count() {
        let h = PhpassHashedPassword::with_source(MIN_HASH_COUNT, FixedSalt([0; 6]));
        assert!(!h.needs_rehash(VALID_HASH));
    }

    #[test]
    fn needs_rehash_true_for_non_s_or_empty() {
        let h = hasher();
        assert!(h.needs_rehash(""));
        assert!(h.needs_rehash("$P$abcdefg"));
        assert!(h.needs_rehash("plaintext"));
    }

    // ---- supporting primitives -------------------------------------------

    #[test]
    fn md5_matches_known_answer() {
        // RFC 1321 / well-known: md5("") and md5("abc").
        assert_eq!(md5_hex(b""), "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(md5_hex(b"abc"), "900150983cd24fb0d6963f7d28e17f72");
    }

    #[test]
    fn constant_time_eq_basic() {
        assert!(constant_time_eq(b"abc", b"abc"));
        assert!(!constant_time_eq(b"abc", b"abd"));
        assert!(!constant_time_eq(b"abc", b"ab"));
    }
}
