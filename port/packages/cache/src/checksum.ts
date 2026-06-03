/**
 * Port of Drupal\Core\Cache\CacheTagsChecksumInterface (+ a temporary TS impl).
 *
 * Source: core/lib/Drupal/Core/Cache/CacheTagsChecksumInterface.php
 *
 * A checksum provider tracks, per cache tag, how many times that tag has been
 * invalidated. A backend stores `getCurrentChecksum(tags)` alongside a cache
 * item; on read it calls `isValid(storedChecksum, tags)` — if any of the tags
 * was invalidated in the meantime the summed checksum will have grown and the
 * item is considered stale.
 *
 * !!! TODO(wasm, task #40): The checksum/hashing algorithm is being ported to
 * Rust→WASM as `crates/cache-checksum` (see ADR-0015). When that crate lands,
 * implement `ChecksumProvider` with a thin async-initialized wrapper around the
 * generated `pkg/` and delete `TsChecksumProvider`. The `ChecksumProvider`
 * interface is the stable seam designed to make that swap a one-line wiring
 * change for consumers (e.g. `MemoryBackend`'s future tag-checksum support).
 */

import type { CacheTagsInvalidatorInterface } from './cache-tags-invalidator-interface.js';

/**
 * Sentinel checksum returned while a storage transaction is in progress.
 *
 * Mirrors `CacheTagsChecksumInterface::INVALID_CHECKSUM_WHILE_IN_TRANSACTION`.
 * Backends should refuse to persist items carrying this checksum, and it is
 * always treated as invalid on read.
 */
export const INVALID_CHECKSUM_WHILE_IN_TRANSACTION = -1;

/**
 * Provides checksums for cache tag invalidations.
 *
 * Port of `Drupal\Core\Cache\CacheTagsChecksumInterface`. Extends the
 * invalidator interface because a checksum provider is itself notified of tag
 * invalidations (so it can bump its counters).
 */
export interface ChecksumProvider extends CacheTagsInvalidatorInterface {
  /**
   * Returns the sum total of invalidations for a given set of tags.
   *
   * @param tags - The cache tags to sum.
   * @returns The combined invalidation checksum.
   */
  getCurrentChecksum(tags: string[]): number;

  /**
   * Returns whether a stored checksum is still valid for the given tags.
   *
   * @param checksum - The checksum stored alongside the cache item.
   * @param tags - The tags stored alongside the cache item.
   * @returns `false` if any tag was invalidated since the checksum was taken.
   */
  isValid(checksum: number, tags: string[]): boolean;

  /** Resets statically tracked tag invalidation counts (test-only). */
  reset(): void;
}

/**
 * Temporary in-memory TypeScript implementation of {@link ChecksumProvider}.
 *
 * Counts invalidations per tag in a `Map`. Adequate for unit tests and the
 * single-process memory backend; to be replaced by the WASM crate (task #40).
 */
export class TsChecksumProvider implements ChecksumProvider {
  /** Per-tag invalidation counters. */
  private readonly tagCounts = new Map<string, number>();

  getCurrentChecksum(tags: string[]): number {
    return this.calculateChecksum(tags);
  }

  isValid(checksum: number, tags: string[]): boolean {
    if (checksum === INVALID_CHECKSUM_WHILE_IN_TRANSACTION) {
      return false;
    }
    return checksum === this.calculateChecksum(tags);
  }

  invalidateTags(tags: string[]): void {
    for (const tag of tags) {
      this.tagCounts.set(tag, (this.tagCounts.get(tag) ?? 0) + 1);
    }
  }

  reset(): void {
    this.tagCounts.clear();
  }

  /** Sums the current invalidation counts for the requested tags. */
  private calculateChecksum(tags: string[]): number {
    let sum = 0;
    for (const tag of tags) {
      sum += this.tagCounts.get(tag) ?? 0;
    }
    return sum;
  }
}
