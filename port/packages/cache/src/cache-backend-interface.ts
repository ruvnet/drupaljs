/**
 * Port of Drupal\Core\Cache\CacheBackendInterface.
 *
 * Source: core/lib/Drupal/Core/Cache/CacheBackendInterface.php
 *
 * Cache identifiers are case sensitive. All cache implementations implement
 * this interface; `MemoryBackend` is the reference implementation here.
 */

/**
 * Indicates that an item should never be removed unless explicitly deleted.
 *
 * Mirrors `CacheBackendInterface::CACHE_PERMANENT`.
 */
export const CACHE_PERMANENT = -1;

/**
 * A single cache item as returned by `get()` / `getMultiple()`.
 *
 * Mirrors the stdClass object Drupal returns from cache backends. Unlike PHP,
 * `data` here holds the *deserialized* value (the structured clone of what was
 * stored); the backend is responsible for isolating it from the stored copy.
 */
export interface CacheItem<T = unknown> {
  /** The cache ID. */
  cid: string;
  /** The cached payload (deserialized). */
  data: T;
  /** Creation time, in Unix seconds (fractional allowed). */
  created: number;
  /** Expiry: `CACHE_PERMANENT` or a Unix timestamp (seconds). */
  expire: number;
  /** Sorted, de-duplicated list of cache tags. */
  tags: string[];
  /** Whether the item is still valid (not expired/invalidated). */
  valid: boolean;
}

/**
 * The shape of an item accepted by `setMultiple()`.
 *
 * Mirrors the associative array Drupal accepts:
 * `['data' => ..., 'expire' => ..., 'tags' => []]`.
 */
export interface CacheSetItem<T = unknown> {
  /** Required payload to store. */
  data: T;
  /** Optional expiry; defaults to `CACHE_PERMANENT`. */
  expire?: number;
  /** Optional cache tags for this item. */
  tags?: string[];
}

/**
 * Defines an interface for cache implementations.
 *
 * Port of `Drupal\Core\Cache\CacheBackendInterface`. Method semantics match
 * Drupal exactly, with PHP `FALSE`-on-miss expressed as `false`.
 */
export interface CacheBackendInterface {
  /**
   * Returns data from the persistent cache.
   *
   * @param cid - The cache ID to retrieve.
   * @param allowInvalid - If `true`, an expired/invalidated item may still be
   *   returned (inspect its `valid` flag). Defaults to `false`.
   * @returns The cache item, or `false` on miss.
   */
  get<T = unknown>(cid: string, allowInvalid?: boolean): CacheItem<T> | false;

  /**
   * Returns data from the persistent cache for an array of cache IDs.
   *
   * Mirrors Drupal's by-reference `&$cids`: the input `cids` array is mutated
   * in place so that any IDs successfully returned are removed from it.
   *
   * @param cids - IDs to retrieve. Mutated: returned IDs are removed.
   * @param allowInvalid - As `get()`. Defaults to `false`.
   * @returns A record of cache items keyed by cache ID.
   */
  getMultiple<T = unknown>(
    cids: string[],
    allowInvalid?: boolean,
  ): Record<string, CacheItem<T>>;

  /**
   * Stores data in the persistent cache.
   *
   * @param cid - The cache ID to store under.
   * @param data - The value to store.
   * @param expire - `CACHE_PERMANENT` or a Unix timestamp. Defaults permanent.
   * @param tags - Cache tags to store with the item, e.g. `['node:123']`.
   */
  set(cid: string, data: unknown, expire?: number, tags?: string[]): void;

  /**
   * Stores multiple items in the persistent cache.
   *
   * @param items - Items keyed by cache ID.
   */
  setMultiple(items: Record<string, CacheSetItem>): void;

  /** Deletes a single item from the cache. */
  delete(cid: string): void;

  /** Deletes multiple items from the cache. */
  deleteMultiple(cids: string[]): void;

  /** Deletes all items in this bin. */
  deleteAll(): void;

  /** Marks a single cache item as invalid (still retrievable with allowInvalid). */
  invalidate(cid: string): void;

  /** Marks multiple cache items as invalid. */
  invalidateMultiple(cids: string[]): void;

  /** Performs garbage collection, removing expired/invalidated items. */
  garbageCollection(): void;

  /** Removes the entire bin. */
  removeBin(): void;
}

/**
 * Minimal port of Drupal\Component\Datetime\TimeInterface.
 *
 * Only `getRequestTime()` is needed by the cache subsystem; it returns the
 * request start time in **Unix seconds** (Drupal semantics), used to compute
 * expiry. The `@drupaljs/testing` `FakeClock` works in milliseconds, so adapt
 * with `() => Math.floor(clock.now() / 1000)` when wiring tests.
 *
 * TODO(contracts): promote this into `@drupaljs/contracts` once the Datetime
 * subsystem is ported, and re-export from there instead of defining locally.
 */
export interface TimeInterface {
  /** The request start time, in Unix seconds. */
  getRequestTime(): number;
}
