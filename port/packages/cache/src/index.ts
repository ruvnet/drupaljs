/**
 * @drupaljs/cache — TypeScript port of Drupal Core's Cache subsystem.
 *
 * Source: drupal-core/core/lib/Drupal/Core/Cache/*
 *
 * Public surface:
 * - Cache backends: `CacheBackendInterface`, `MemoryBackend`.
 * - Cache tags: `CacheTagsInvalidatorInterface`, `CacheTagsInvalidator`,
 *   and the tag-checksum seam (`ChecksumProvider` + temporary `TsChecksumProvider`).
 * - Cacheability metadata: `CacheableDependencyInterface`,
 *   `RefinableCacheableDependencyInterface`, `CacheableMetadata`.
 * - Cache contexts: `CacheContextInterface`, `CalculatedCacheContextInterface`,
 *   `CacheContextsManager`, `ContextCacheKeys`.
 * - The `Cache` static helpers (merge tags/contexts/max-ages, build tags).
 *
 * NOTE on contracts: `@drupaljs/contracts` carries an early sketch of the cache
 * interfaces that diverges from Drupal 11 (no `allowInvalid`, `setMultiple`
 * shape, string checksums, deprecated `invalidateAll`). This package defines the
 * Drupal-faithful interfaces locally.
 * TODO(contracts): reconcile `@drupaljs/contracts` cache interfaces with these,
 * then re-export the canonical interfaces from there.
 */

export {
  CACHE_PERMANENT,
  type CacheBackendInterface,
  type CacheItem,
  type CacheSetItem,
  type TimeInterface,
} from './cache-backend-interface.js';

export {
  type CacheTagsInvalidatorInterface,
  type CacheTagsPurgeInterface,
} from './cache-tags-invalidator-interface.js';

export { Cache } from './cache.js';

export { MemoryBackend } from './memory-backend.js';

export { CacheTagsInvalidator } from './cache-tags-invalidator.js';

export {
  INVALID_CHECKSUM_WHILE_IN_TRANSACTION,
  type ChecksumProvider,
  TsChecksumProvider,
} from './checksum.js';

export {
  type CacheableDependencyInterface,
  type RefinableCacheableDependencyInterface,
  isCacheableDependency,
  CacheableMetadata,
} from './cacheable-metadata.js';

export {
  type CacheContextInterface,
  type CalculatedCacheContextInterface,
  type AnyCacheContext,
} from './context/cache-context-interface.js';

export { ContextCacheKeys } from './context/context-cache-keys.js';

export {
  CacheContextsManager,
  type ContextServiceLocator,
} from './context/cache-contexts-manager.js';
