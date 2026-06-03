/**
 * Minimal cacheability contracts for the configuration system.
 *
 * TODO: Replace these local definitions with the shared @drupaljs/cache package
 * (port of Drupal\Core\Cache) once it exists. They are intentionally minimal —
 * enough for ConfigBase to expose cache tags/contexts/max-age and for overrides
 * to contribute cacheable metadata.
 *
 * @see drupal-core/core/lib/Drupal/Core/Cache/Cache.php
 * @see drupal-core/core/lib/Drupal/Core/Cache/CacheableDependencyInterface.php
 */

/** Sentinel meaning "cache permanently" (Drupal's Cache::PERMANENT). */
export const CACHE_PERMANENT = -1;

/** Plain cacheable metadata bag. Port of CacheableMetadata's accessors. */
export interface CacheableMetadata {
  cacheTags: string[];
  cacheContexts: string[];
  cacheMaxAge: number;
}

/** Port of Drupal\Core\Cache\CacheableDependencyInterface. */
export interface CacheableDependencyInterface {
  getCacheTags(): string[];
  getCacheContexts(): string[];
  getCacheMaxAge(): number;
}

/** Subset of Cache:: static helpers used by the config system. */
export const Cache = {
  /** Merges two cache-tag lists, returning a de-duplicated, sorted array. */
  mergeTags(a: string[], b: string[]): string[] {
    return [...new Set([...a, ...b])].sort();
  },

  /** Merges two cache-context lists, returning a de-duplicated, sorted array. */
  mergeContexts(a: string[], b: string[]): string[] {
    return [...new Set([...a, ...b])].sort();
  },

  /** Returns the most restrictive (smallest non-negative) max-age. */
  mergeMaxAges(a: number, b: number): number {
    if (a === CACHE_PERMANENT) return b;
    if (b === CACHE_PERMANENT) return a;
    return Math.min(a, b);
  },

  /**
   * Invalidates the given cache tags.
   *
   * TODO: Wire to the real cache-tags invalidator once @drupaljs/cache lands.
   * No-op for now so that save()/delete() behave correctly in isolation.
   */
  invalidateTags(_tags: string[]): void {
    // intentionally a no-op until the cache subsystem is ported
  },
};
