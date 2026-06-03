/**
 * Port of Drupal\Core\Cache\CacheTagsInvalidator.
 *
 * Source: core/lib/Drupal/Core/Cache/CacheTagsInvalidator.php
 *
 * Central fan-out point for cache tag invalidations: notifies every registered
 * invalidator and every registered cache bin that supports tag invalidation.
 */

import type {
  CacheTagsInvalidatorInterface,
  CacheTagsPurgeInterface,
} from './cache-tags-invalidator-interface.js';
import type { CacheBackendInterface } from './cache-backend-interface.js';
import type { ChecksumProvider } from './checksum.js';

/** Structural guard: does the value implement `purge()`? */
function isPurgeable(
  value: CacheTagsInvalidatorInterface,
): value is CacheTagsInvalidatorInterface & CacheTagsPurgeInterface {
  return typeof (value as Partial<CacheTagsPurgeInterface>).purge === 'function';
}

/** Structural guard: does the value implement the checksum provider contract? */
function isChecksumProvider(
  value: CacheTagsInvalidatorInterface,
): value is ChecksumProvider {
  const candidate = value as Partial<ChecksumProvider>;
  return (
    typeof candidate.reset === 'function' &&
    typeof candidate.getCurrentChecksum === 'function' &&
    typeof candidate.isValid === 'function'
  );
}

/** Structural guard: does a backend handle tag invalidation? */
function isInvalidatingBin(
  bin: CacheBackendInterface,
): bin is CacheBackendInterface & CacheTagsInvalidatorInterface {
  return (
    typeof (bin as Partial<CacheTagsInvalidatorInterface>).invalidateTags ===
    'function'
  );
}

export class CacheTagsInvalidator
  implements CacheTagsInvalidatorInterface, CacheTagsPurgeInterface
{
  /** Registered cache tag invalidators. */
  private readonly invalidators: CacheTagsInvalidatorInterface[] = [];

  /** Registered cache bins that support invalidation. */
  private readonly bins: (CacheBackendInterface &
    CacheTagsInvalidatorInterface)[] = [];

  invalidateTags(tags: string[]): void {
    for (const invalidator of this.invalidators) {
      invalidator.invalidateTags(tags);
    }
    for (const bin of this.bins) {
      bin.invalidateTags(tags);
    }
  }

  /** Resets statically cached tags in all checksum services (test-only). */
  resetChecksums(): void {
    for (const invalidator of this.invalidators) {
      if (isChecksumProvider(invalidator)) {
        invalidator.reset();
      }
    }
  }

  purge(): void {
    for (const invalidator of this.invalidators) {
      if (isPurgeable(invalidator)) {
        invalidator.purge();
      }
    }
  }

  /** Registers a cache tags invalidator. */
  addInvalidator(invalidator: CacheTagsInvalidatorInterface): void {
    this.invalidators.push(invalidator);
  }

  /** Registers a cache bin; ignored unless it supports tag invalidation. */
  addBin(bin: CacheBackendInterface): void {
    if (isInvalidatingBin(bin)) {
      this.bins.push(bin);
    }
  }
}
