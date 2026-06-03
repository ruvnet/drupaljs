/**
 * Port of Drupal\Core\Cache\Context\ContextCacheKeys.
 *
 * Source: core/lib/Drupal/Core/Cache/Context/ContextCacheKeys.php
 *
 * A value object holding generated cache keys together with their cacheability
 * metadata. Keys are always sorted so that any ordering of the same contexts
 * produces an identical cache ID.
 */

import { CacheableMetadata } from '../cacheable-metadata.js';

export class ContextCacheKeys extends CacheableMetadata {
  /** The sorted, generated cache keys. */
  private readonly keys: string[];

  /**
   * @param keys - The context cache keys (sorted on construction).
   */
  constructor(keys: string[]) {
    super();
    // Domain invariant: keys are always sorted (same combination -> same cid).
    this.keys = [...keys].sort();
  }

  /** Returns the generated cache keys. */
  getKeys(): string[] {
    return this.keys;
  }
}
