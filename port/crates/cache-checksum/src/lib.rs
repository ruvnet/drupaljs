//! `drupaljs-cache-checksum` — cache-tag invalidation checksums.
//!
//! Rust/WASM port of Drupal's `DatabaseCacheTagsChecksum` /
//! `CacheTagsChecksumTrait` (ADR-0015). It maintains a per-tag invalidation
//! counter and derives a checksum (the sum of the requested tags' counters)
//! used by cache backends to detect tag-based invalidation of stored items.
//!
//! Two surfaces are exported:
//!
//! 1. **Plain-Rust API** ([`CacheTagsChecksum`]) for the `rlib` and
//!    `cargo test` — typed, panic-free, no JS marshalling.
//! 2. **`#[wasm_bindgen]` API** ([`CacheChecksum`]) for the `cdylib` — a thin
//!    adapter that takes JS `string[]` (marshalled as `Vec<String>`) and
//!    returns `i64`/`bool`, keeping the boundary allocation-light.
//!
//! ## TypeScript wrapper (consumed by `@drupaljs/cache`)
//!
//! `wasm-pack build --target web` emits `pkg/`. A thin TS wrapper holds one
//! `CacheChecksum` instance per request:
//!
//! ```ts
//! import init, { CacheChecksum } from "drupaljs-cache-checksum";
//! await init();
//! const checksums = new CacheChecksum();
//! checksums.invalidateTags(["node:1"]);
//! const stamp = checksums.getCurrentChecksum(["node:1"]); // 1n
//! const fresh = checksums.isValid(stamp, ["node:1"]);      // true
//! ```

mod checksum;

pub use checksum::{CacheTagsChecksum, INVALID_CHECKSUM_WHILE_IN_TRANSACTION};

use wasm_bindgen::prelude::*;

/// WASM-exported handle wrapping a [`CacheTagsChecksum`].
///
/// Method names use Drupal's camelCase contract so the generated JS reads like
/// `CacheTagsChecksumInterface`. Checksums cross the boundary as `i64` (JS
/// `bigint`), which losslessly represents the summed invalidation counts and
/// the `-1` in-transaction sentinel.
#[wasm_bindgen]
pub struct CacheChecksum {
    inner: CacheTagsChecksum,
}

#[wasm_bindgen]
impl CacheChecksum {
    /// Creates an empty checksum tracker.
    #[wasm_bindgen(constructor)]
    pub fn new() -> CacheChecksum {
        CacheChecksum {
            inner: CacheTagsChecksum::new(),
        }
    }

    /// Invalidates a set of cache tags (`string[]`).
    #[wasm_bindgen(js_name = invalidateTags)]
    pub fn invalidate_tags(&mut self, tags: Vec<String>) {
        self.inner.invalidate_tags(tags);
    }

    /// Returns the current checksum (sum of counters) for the given tags, or
    /// the in-transaction sentinel `-1` if any tag is delayed.
    #[wasm_bindgen(js_name = getCurrentChecksum)]
    pub fn get_current_checksum(&mut self, tags: Vec<String>) -> i64 {
        self.inner.current_checksum(&tags)
    }

    /// Returns whether `checksum` is still valid for the given tags.
    #[wasm_bindgen(js_name = isValid)]
    pub fn is_valid(&self, checksum: i64, tags: Vec<String>) -> bool {
        self.inner.is_valid(checksum, &tags)
    }

    /// Begins a transaction; subsequent invalidations are delayed until commit.
    #[wasm_bindgen(js_name = beginTransaction)]
    pub fn begin_transaction(&mut self) {
        self.inner.begin_transaction();
    }

    /// Ends the open transaction, applying delayed invalidations on `success`.
    pub fn commit(&mut self, success: bool) {
        self.inner.commit(success);
    }

    /// Resets the per-request invalidation guard (counters are preserved).
    pub fn reset(&mut self) {
        self.inner.reset();
    }

    /// Truncates all invalidation counters and resets request state.
    pub fn purge(&mut self) {
        self.inner.purge();
    }
}

impl Default for CacheChecksum {
    fn default() -> Self {
        Self::new()
    }
}

/// The in-transaction sentinel exposed to JS as a function (constants can't
/// cross the `wasm-bindgen` boundary as fields). Equals `-1`.
#[wasm_bindgen(js_name = invalidChecksumWhileInTransaction)]
pub fn invalid_checksum_while_in_transaction() -> i64 {
    INVALID_CHECKSUM_WHILE_IN_TRANSACTION
}

#[cfg(test)]
mod tests {
    //! Boundary-adapter tests for the `#[wasm_bindgen]` surface. The core
    //! algorithm is covered in `checksum.rs`; these assert the camelCase
    //! adapter wires through correctly.
    use super::*;

    #[test]
    fn wasm_handle_tracks_invalidations() {
        let mut c = CacheChecksum::new();
        c.invalidate_tags(vec!["node:1".into()]);
        assert_eq!(c.get_current_checksum(vec!["node:1".into()]), 1);
    }

    #[test]
    fn wasm_is_valid_roundtrip() {
        let mut c = CacheChecksum::new();
        c.invalidate_tags(vec!["a".into()]);
        let stamp = c.get_current_checksum(vec!["a".into()]);
        assert!(c.is_valid(stamp, vec!["a".into()]));
        c.invalidate_tags(vec!["a".into()]);
        assert!(!c.is_valid(stamp, vec!["a".into()]));
    }

    #[test]
    fn wasm_transaction_lifecycle() {
        let mut c = CacheChecksum::new();
        c.begin_transaction();
        c.invalidate_tags(vec!["t".into()]);
        assert_eq!(
            c.get_current_checksum(vec!["t".into()]),
            INVALID_CHECKSUM_WHILE_IN_TRANSACTION
        );
        c.commit(true);
        assert_eq!(c.get_current_checksum(vec!["t".into()]), 1);
    }

    #[test]
    fn wasm_purge_clears_everything() {
        let mut c = CacheChecksum::new();
        c.invalidate_tags(vec!["a".into()]);
        c.purge();
        assert_eq!(c.get_current_checksum(vec!["a".into()]), 0);
    }

    #[test]
    fn sentinel_helper_matches_constant() {
        assert_eq!(
            invalid_checksum_while_in_transaction(),
            INVALID_CHECKSUM_WHILE_IN_TRANSACTION
        );
        assert_eq!(invalid_checksum_while_in_transaction(), -1);
    }
}
