/**
 * Cache-subsystem seam for page_cache.
 *
 * The middleware needs Drupal's `CacheBackendInterface`, the `Cache::PERMANENT`
 * constant, and `CacheableMetadata` (to read cache tags off a cacheable
 * response). These are already ported in `@drupaljs/cache`, so re-export them
 * through this single seam — keeps the middleware's imports stable if the cache
 * package's layout shifts.
 */
export {
  CACHE_PERMANENT,
  type CacheBackendInterface,
  type CacheItem,
  CacheableMetadata,
} from '@drupaljs/cache';
