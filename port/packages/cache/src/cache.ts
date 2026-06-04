/**
 * Port of Drupal\Core\Cache\Cache (static helper methods).
 *
 * Source: core/lib/Drupal/Core/Cache/Cache.php
 *
 * Only the pure, container-free helpers are ported here: tag/context merging,
 * max-age merging and tag building. The `Cache::invalidateTags()`,
 * `Cache::getBins()` and `Cache::getMemoryBins()` static facades depend on the
 * global service container and belong to the bootstrap layer.
 *
 * Drupal's `mergeContexts()` additionally asserts token validity via the
 * `cache_contexts_manager` service; that assertion is dev-only and is the
 * responsibility of the contexts manager here (see CacheContextsManager).
 */

import { CACHE_PERMANENT } from './cache-backend-interface.js';

export class Cache {
  /** Indicates an item should never be removed unless explicitly deleted. */
  static readonly PERMANENT = CACHE_PERMANENT;

  /**
   * Merges lists of cache contexts and removes duplicates.
   *
   * @param cacheContexts - Context lists to merge.
   * @returns The merged, de-duplicated list (first-seen order preserved).
   */
  static mergeContexts(...cacheContexts: string[][]): string[] {
    return dedupe(cacheContexts);
  }

  /**
   * Merges lists of cache tags and removes duplicates.
   *
   * @param cacheTags - Tag lists to merge.
   * @returns The merged, de-duplicated list (first-seen order preserved).
   */
  static mergeTags(...cacheTags: string[][]): string[] {
    return dedupe(cacheTags);
  }

  /**
   * Merges max-age values (in seconds), finding the lowest max-age.
   *
   * `CACHE_PERMANENT` (infinite) is filtered out so it never wins over a finite
   * value; if nothing finite remains the result is `CACHE_PERMANENT`.
   *
   * @param maxAges - Max-age values to merge.
   * @returns The minimum finite max-age, or `CACHE_PERMANENT`.
   */
  static mergeMaxAges(...maxAges: number[]): number {
    const finite = maxAges.filter((maxAge) => maxAge !== CACHE_PERMANENT);
    return finite.length === 0 ? CACHE_PERMANENT : Math.min(...finite);
  }

  /**
   * Builds a list of cache tags from a prefix and a list of suffixes.
   *
   * @param prefix - The tag prefix.
   * @param suffixes - Suffixes, coerced to strings.
   * @param glue - Separator between prefix and suffix. Defaults to `':'`.
   * @returns The list of constructed cache tags.
   */
  static buildTags(
    prefix: string,
    suffixes: ReadonlyArray<string | number>,
    glue = ':',
  ): string[] {
    return suffixes.map((suffix) => `${prefix}${glue}${String(suffix)}`);
  }
}

/** Flattens lists and removes duplicates, preserving first-seen order. */
function dedupe(lists: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}
