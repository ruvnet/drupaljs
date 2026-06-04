//! Plain-Rust cache-tag checksum engine.
//!
//! Direct port of Drupal's `CacheTagsChecksumTrait` /
//! `DatabaseCacheTagsChecksum`. The database `{cachetags}` table — a map from
//! tag string to an `invalidations` integer counter — is replaced here by an
//! in-process `HashMap<String, i64>` which is the authoritative store of
//! per-tag invalidation counts.
//!
//! Semantics mirrored from core:
//!
//! * [`CacheTagsChecksum::invalidate_tags`] increments each tag's counter once
//!   per call (de-duplicating tags already invalidated this "request" via
//!   `invalidated_tags`, exactly like the trait). When a transaction is open,
//!   invalidations are *delayed* and merged into `delayed_tags` until commit.
//! * [`CacheTagsChecksum::current_checksum`] returns the sum of the counters of
//!   the requested tags, or [`INVALID_CHECKSUM_WHILE_IN_TRANSACTION`] when any
//!   requested tag is currently delayed.
//! * [`CacheTagsChecksum::is_valid`] returns `true` for an empty tag set,
//!   `false` if any requested tag is delayed, otherwise compares the stored
//!   checksum against the freshly calculated one.

use std::collections::HashMap;

/// The checksum returned while a transaction is in progress, matching
/// `CacheTagsChecksumInterface::INVALID_CHECKSUM_WHILE_IN_TRANSACTION`.
///
/// Cache backends MUST treat this value as "do not persist": any item written
/// with this checksum can never validate, so the write is intentionally wasted.
pub const INVALID_CHECKSUM_WHILE_IN_TRANSACTION: i64 = -1;

/// In-memory cache-tag invalidation checksum tracker.
///
/// Equivalent to a `DatabaseCacheTagsChecksum` whose backing `{cachetags}`
/// table lives in this struct's `counts` map.
#[derive(Debug, Default, Clone)]
pub struct CacheTagsChecksum {
    /// Authoritative per-tag invalidation counts (the `{cachetags}` table).
    counts: HashMap<String, i64>,
    /// Tags already invalidated during the current request (de-dup guard).
    invalidated_tags: HashMap<String, ()>,
    /// Tags whose invalidation is delayed until the open transaction commits.
    delayed_tags: HashMap<String, ()>,
    /// Whether a transaction is currently open.
    in_transaction: bool,
}

impl CacheTagsChecksum {
    /// Creates an empty checksum tracker (all tags implicitly count `0`).
    pub fn new() -> Self {
        Self::default()
    }

    /// The raw invalidation count for a single tag (`0` if never invalidated).
    pub fn count(&self, tag: &str) -> i64 {
        self.counts.get(tag).copied().unwrap_or(0)
    }

    /// Invalidates a set of tags.
    ///
    /// Tags already invalidated this request are skipped (mirroring the trait's
    /// `invalidatedTags` guard). Outside a transaction the surviving tags are
    /// applied immediately; inside one they are merged into `delayed_tags` and
    /// applied on [`commit`](Self::commit).
    pub fn invalidate_tags<I, S>(&mut self, tags: I)
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let mut pending: Vec<String> = Vec::new();
        for tag in tags {
            let tag = tag.into();
            if self.invalidated_tags.contains_key(&tag) {
                // Already invalidated this request — drop it.
                continue;
            }
            self.invalidated_tags.insert(tag.clone(), ());
            pending.push(tag);
        }

        if pending.is_empty() {
            return;
        }

        if self.in_transaction {
            for tag in pending {
                self.delayed_tags.insert(tag, ());
            }
        } else {
            self.do_invalidate_tags(&pending);
        }
    }

    /// Applies invalidations immediately, incrementing each tag's counter.
    ///
    /// Analogue of `DatabaseCacheTagsChecksum::doInvalidateTags` (the
    /// `invalidations = invalidations + 1` merge per tag).
    fn do_invalidate_tags(&mut self, tags: &[String]) {
        for tag in tags {
            *self.counts.entry(tag.clone()).or_insert(0) += 1;
        }
    }

    /// Returns the current checksum for `tags`: the sum of their counters.
    ///
    /// Returns [`INVALID_CHECKSUM_WHILE_IN_TRANSACTION`] if any requested tag is
    /// currently delayed. As in core, requested tags are removed from the
    /// per-request `invalidated_tags` guard so they can be invalidated again
    /// later in the same request.
    pub fn current_checksum<S: AsRef<str>>(&mut self, tags: &[S]) -> i64 {
        if self.any_delayed(tags) {
            return INVALID_CHECKSUM_WHILE_IN_TRANSACTION;
        }
        for tag in tags {
            self.invalidated_tags.remove(tag.as_ref());
        }
        self.calculate_checksum(tags)
    }

    /// Returns whether `checksum` still matches the current state of `tags`.
    ///
    /// Empty tag sets are always valid; a delayed tag forces invalidity (the
    /// item must be recomputed); otherwise the stored value must equal the
    /// freshly calculated checksum.
    pub fn is_valid<S: AsRef<str>>(&self, checksum: i64, tags: &[S]) -> bool {
        if tags.is_empty() {
            return true;
        }
        if self.any_delayed(tags) {
            return false;
        }
        checksum == self.calculate_checksum(tags)
    }

    /// Sum of the invalidation counters for the given tags.
    fn calculate_checksum<S: AsRef<str>>(&self, tags: &[S]) -> i64 {
        tags.iter().map(|t| self.count(t.as_ref())).sum()
    }

    /// `true` if any of `tags` is currently in the delayed set.
    fn any_delayed<S: AsRef<str>>(&self, tags: &[S]) -> bool {
        tags.iter().any(|t| self.delayed_tags.contains_key(t.as_ref()))
    }

    /// Marks the start of a transaction; subsequent invalidations are delayed.
    pub fn begin_transaction(&mut self) {
        self.in_transaction = true;
    }

    /// Whether a transaction is currently open.
    pub fn in_transaction(&self) -> bool {
        self.in_transaction
    }

    /// Ends the open transaction, applying delayed invalidations.
    ///
    /// Mirrors `rootTransactionEndCallback`: on `success` the delayed tags are
    /// invalidated; either way the delayed set is cleared and the transaction
    /// flag is reset.
    pub fn commit(&mut self, success: bool) {
        let delayed: Vec<String> = self.delayed_tags.keys().cloned().collect();
        if success {
            self.do_invalidate_tags(&delayed);
        }
        self.delayed_tags.clear();
        self.in_transaction = false;
    }

    /// Resets the per-request guards (`tagCache` + `invalidatedTags` in core).
    ///
    /// Counters and any open transaction state are left intact, matching
    /// `CacheTagsChecksumTrait::reset()` which only clears the static caches.
    pub fn reset(&mut self) {
        self.invalidated_tags.clear();
    }

    /// Truncates the `{cachetags}` table and resets request state.
    ///
    /// Analogue of `DatabaseCacheTagsChecksum::purge()`.
    pub fn purge(&mut self) {
        self.counts.clear();
        self.delayed_tags.clear();
        self.in_transaction = false;
        self.reset();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cs() -> CacheTagsChecksum {
        CacheTagsChecksum::new()
    }

    #[test]
    fn fresh_tracker_has_zero_checksum() {
        let mut c = cs();
        assert_eq!(c.current_checksum(&["node:1"]), 0);
        assert_eq!(c.current_checksum::<&str>(&[]), 0);
    }

    #[test]
    fn invalidate_increments_counter_by_one() {
        let mut c = cs();
        c.invalidate_tags(["node:1"]);
        assert_eq!(c.count("node:1"), 1);
        assert_eq!(c.current_checksum(&["node:1"]), 1);
    }

    #[test]
    fn checksum_is_sum_of_tag_counts() {
        let mut c = cs();
        c.invalidate_tags(["a"]);
        c.invalidate_tags(["b"]);
        // Reading the checksum clears the per-request guard so "b" can be
        // invalidated again (simulating a later request).
        c.current_checksum(&["b"]);
        c.invalidate_tags(["b"]); // b -> 2
        assert_eq!(c.current_checksum(&["a", "b"]), 3);
    }

    #[test]
    fn duplicate_invalidation_in_same_call_counts_once() {
        let mut c = cs();
        c.invalidate_tags(["x", "x", "x"]);
        assert_eq!(c.count("x"), 1);
    }

    #[test]
    fn invalidation_dedups_within_request_until_checksum_read() {
        let mut c = cs();
        c.invalidate_tags(["x"]);
        // Second invalidate in same request is suppressed by the guard.
        c.invalidate_tags(["x"]);
        assert_eq!(c.count("x"), 1);
        // Reading the checksum clears the guard for those tags...
        assert_eq!(c.current_checksum(&["x"]), 1);
        // ...so a later invalidation in the same request takes effect again.
        c.invalidate_tags(["x"]);
        assert_eq!(c.count("x"), 2);
    }

    #[test]
    fn is_valid_true_when_checksum_matches() {
        let mut c = cs();
        c.invalidate_tags(["node:1"]);
        let stored = c.current_checksum(&["node:1"]);
        assert!(c.is_valid(stored, &["node:1"]));
    }

    #[test]
    fn is_valid_false_after_subsequent_invalidation() {
        let mut c = cs();
        let stored = c.current_checksum(&["node:1"]); // 0
        c.invalidate_tags(["node:1"]); // -> 1
        assert!(!c.is_valid(stored, &["node:1"]));
    }

    #[test]
    fn is_valid_true_for_empty_tags_regardless_of_checksum() {
        let c = cs();
        assert!(c.is_valid(999, &[] as &[&str]));
    }

    #[test]
    fn delayed_invalidation_during_transaction() {
        let mut c = cs();
        c.begin_transaction();
        c.invalidate_tags(["t"]);
        // Counter is NOT yet incremented while delayed.
        assert_eq!(c.count("t"), 0);
        // Checksum for a delayed tag is the in-transaction sentinel.
        assert_eq!(
            c.current_checksum(&["t"]),
            INVALID_CHECKSUM_WHILE_IN_TRANSACTION
        );
        // And such items are never valid.
        assert!(!c.is_valid(0, &["t"]));
    }

    #[test]
    fn commit_success_applies_delayed_tags() {
        let mut c = cs();
        c.begin_transaction();
        c.invalidate_tags(["t"]);
        c.commit(true);
        assert!(!c.in_transaction());
        assert_eq!(c.count("t"), 1);
        assert_eq!(c.current_checksum(&["t"]), 1);
    }

    #[test]
    fn commit_failure_discards_delayed_tags() {
        let mut c = cs();
        c.begin_transaction();
        c.invalidate_tags(["t"]);
        c.commit(false);
        assert_eq!(c.count("t"), 0);
    }

    #[test]
    fn purge_truncates_all_counts() {
        let mut c = cs();
        c.invalidate_tags(["a"]);
        c.invalidate_tags(["b"]);
        c.purge();
        assert_eq!(c.current_checksum(&["a", "b"]), 0);
    }

    #[test]
    fn reset_clears_request_guard_but_keeps_counts() {
        let mut c = cs();
        c.invalidate_tags(["a"]);
        c.reset();
        // Count survives reset.
        assert_eq!(c.count("a"), 1);
        // Guard was cleared, so a re-invalidation lands immediately.
        c.invalidate_tags(["a"]);
        assert_eq!(c.count("a"), 2);
    }
}
