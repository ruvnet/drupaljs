/**
 * Port of Drupal\Core\Cache\MemoryBackend.
 *
 * Source: core/lib/Drupal/Core/Cache/MemoryBackend.php
 *
 * Stores cache items in memory. Intended for tests and specialist use-cases;
 * does not persist between processes.
 *
 * Data isolation: Drupal uses `serialize()`/`unserialize()` on store/read so a
 * caller mutating the value after `set()` (or mutating a returned item) cannot
 * corrupt the stored copy. We achieve the same with `structuredClone()` on both
 * write and read.
 */

import {
  CACHE_PERMANENT,
  type CacheBackendInterface,
  type CacheItem,
  type CacheSetItem,
  type TimeInterface,
} from './cache-backend-interface.js';
import type { CacheTagsInvalidatorInterface } from './cache-tags-invalidator-interface.js';

/** Internal stored representation; `data` holds a serialized-equivalent clone. */
interface StoredItem {
  cid: string;
  data: unknown;
  created: number;
  expire: number;
  tags: string[];
}

export class MemoryBackend
  implements CacheBackendInterface, CacheTagsInvalidatorInterface
{
  /** Cache items keyed by cache ID. */
  private cache = new Map<string, StoredItem>();

  /**
   * @param time - The time service, providing the request time in Unix seconds.
   */
  constructor(private readonly time: TimeInterface) {}

  get<T = unknown>(cid: string, allowInvalid = false): CacheItem<T> | false {
    const stored = this.cache.get(cid);
    if (stored === undefined) {
      return false;
    }
    return this.prepareItem<T>(stored, allowInvalid);
  }

  getMultiple<T = unknown>(
    cids: string[],
    allowInvalid = false,
  ): Record<string, CacheItem<T>> {
    const result: Record<string, CacheItem<T>> = {};
    for (const cid of cids) {
      const stored = this.cache.get(cid);
      if (stored === undefined) {
        continue;
      }
      const item = this.prepareItem<T>(stored, allowInvalid);
      if (item !== false) {
        result[item.cid] = item;
      }
    }
    // Mirror Drupal's by-reference $cids: remove the IDs we returned.
    const returned = new Set(Object.keys(result));
    for (let i = cids.length - 1; i >= 0; i--) {
      if (returned.has(cids[i]!)) {
        cids.splice(i, 1);
      }
    }
    return result;
  }

  set(
    cid: string,
    data: unknown,
    expire: number = CACHE_PERMANENT,
    tags: string[] = [],
  ): void {
    // De-duplicate and sort tags for consistent storage (Drupal parity).
    const normalizedTags = Array.from(new Set(tags)).sort();
    this.cache.set(cid, {
      cid,
      data: clone(data),
      created: this.time.getRequestTime(),
      expire,
      tags: normalizedTags,
    });
  }

  setMultiple(items: Record<string, CacheSetItem>): void {
    for (const [cid, item] of Object.entries(items)) {
      this.set(cid, item.data, item.expire ?? CACHE_PERMANENT, item.tags ?? []);
    }
  }

  delete(cid: string): void {
    this.cache.delete(cid);
  }

  deleteMultiple(cids: string[]): void {
    for (const cid of cids) {
      this.cache.delete(cid);
    }
  }

  deleteAll(): void {
    this.cache.clear();
  }

  invalidate(cid: string): void {
    const stored = this.cache.get(cid);
    if (stored !== undefined) {
      stored.expire = this.time.getRequestTime() - 1;
    }
  }

  invalidateMultiple(cids: string[]): void {
    const now = this.time.getRequestTime();
    for (const cid of cids) {
      const stored = this.cache.get(cid);
      if (stored !== undefined) {
        stored.expire = now - 1;
      }
    }
  }

  invalidateTags(tags: string[]): void {
    const now = this.time.getRequestTime();
    const wanted = new Set(tags);
    for (const stored of this.cache.values()) {
      if (stored.tags.some((tag) => wanted.has(tag))) {
        stored.expire = now - 1;
      }
    }
  }

  garbageCollection(): void {
    const now = this.time.getRequestTime();
    for (const [cid, stored] of this.cache) {
      if (stored.expire !== CACHE_PERMANENT && stored.expire < now) {
        this.cache.delete(cid);
      }
    }
  }

  removeBin(): void {
    this.cache.clear();
  }

  /** Resets the backend (test-only); mirrors `MemoryBackend::reset()`. */
  reset(): void {
    this.cache.clear();
  }

  /**
   * Prepares a stored item for return: clones data, computes validity, and
   * applies the `allowInvalid` filter.
   *
   * @returns The prepared item, or `false` if invalid and not allowed.
   */
  private prepareItem<T>(
    stored: StoredItem,
    allowInvalid: boolean,
  ): CacheItem<T> | false {
    const valid =
      stored.expire === CACHE_PERMANENT ||
      stored.expire >= this.time.getRequestTime();

    if (!allowInvalid && !valid) {
      return false;
    }

    return {
      cid: stored.cid,
      data: clone(stored.data) as T,
      created: stored.created,
      expire: stored.expire,
      tags: [...stored.tags],
      valid,
    };
  }
}

/** Deep-clones a value to isolate it from caller mutation (serialize parity). */
function clone<T>(value: T): T {
  return structuredClone(value);
}
