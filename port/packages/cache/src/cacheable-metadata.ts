/**
 * Port of Drupal's cacheability metadata value object and interfaces.
 *
 * Sources:
 * - core/lib/Drupal/Core/Cache/CacheableDependencyInterface.php
 * - core/lib/Drupal/Core/Cache/RefinableCacheableDependencyInterface.php
 * - core/lib/Drupal/Core/Cache/CacheableMetadata.php
 * - core/lib/Drupal/Core/Cache/CacheableDependencyTrait.php
 * - core/lib/Drupal/Core/Cache/RefinableCacheableDependencyTrait.php
 *
 * The PHP traits are folded directly into the `CacheableMetadata` class here,
 * since TypeScript classes don't compose traits the way PHP does.
 */

import { CACHE_PERMANENT } from './cache-backend-interface.js';
import { Cache } from './cache.js';

/**
 * Defines an interface for objects usable by other cached objects.
 *
 * Port of `Drupal\Core\Cache\CacheableDependencyInterface`. Cacheability
 * metadata bubbles to parents: a child's contexts/tags/max-age also constrain
 * any parent that caches it.
 */
export interface CacheableDependencyInterface {
  /** The cache contexts that vary this object. */
  getCacheContexts(): string[];
  /** The cache tags that invalidate this object. */
  getCacheTags(): string[];
  /** The maximum age (seconds) this object may be cached; `CACHE_PERMANENT` = forever. */
  getCacheMaxAge(): number;
}

/**
 * Adds mutators that fold additional cacheability in.
 *
 * Port of `Drupal\Core\Cache\RefinableCacheableDependencyInterface`.
 */
export interface RefinableCacheableDependencyInterface
  extends CacheableDependencyInterface {
  /** Adds another dependency's cacheability to this object. */
  addCacheableDependency(other: unknown): this;
  /** Adds cache contexts (merged + de-duplicated). */
  addCacheContexts(contexts: string[]): this;
  /** Adds cache tags (merged + de-duplicated). */
  addCacheTags(tags: string[]): this;
  /** Merges in a max-age, keeping the lowest finite value. */
  mergeCacheMaxAge(maxAge: number): this;
}

/**
 * Structural type guard for {@link CacheableDependencyInterface}.
 *
 * TypeScript erases interfaces at runtime, so this checks for the three
 * accessor methods (mirroring PHP's `instanceof`).
 */
export function isCacheableDependency(
  value: unknown,
): value is CacheableDependencyInterface {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<CacheableDependencyInterface>;
  return (
    typeof candidate.getCacheContexts === 'function' &&
    typeof candidate.getCacheTags === 'function' &&
    typeof candidate.getCacheMaxAge === 'function'
  );
}

/**
 * Defines a generic class for passing cacheability metadata.
 *
 * Port of `Drupal\Core\Cache\CacheableMetadata`, with the cacheable-dependency
 * traits inlined.
 */
export class CacheableMetadata implements RefinableCacheableDependencyInterface {
  /** Cache contexts. */
  protected cacheContexts: string[] = [];
  /** Cache tags. */
  protected cacheTags: string[] = [];
  /** Cache max-age (seconds), defaulting to permanent. */
  protected cacheMaxAge: number = CACHE_PERMANENT;

  getCacheContexts(): string[] {
    return this.cacheContexts;
  }

  getCacheTags(): string[] {
    return this.cacheTags;
  }

  getCacheMaxAge(): number {
    return this.cacheMaxAge;
  }

  /** Replaces the cache contexts. Fluent. */
  setCacheContexts(cacheContexts: string[]): this {
    this.cacheContexts = cacheContexts;
    return this;
  }

  /** Replaces the cache tags. Fluent. */
  setCacheTags(cacheTags: string[]): this {
    this.cacheTags = cacheTags;
    return this;
  }

  /**
   * Replaces the max-age (seconds). Fluent.
   *
   * @throws RangeError if `maxAge` is not an integer (PHP throws InvalidArgument).
   */
  setCacheMaxAge(maxAge: number): this {
    if (!Number.isInteger(maxAge)) {
      throw new RangeError('maxAge must be an integer');
    }
    this.cacheMaxAge = maxAge;
    return this;
  }

  addCacheableDependency(other: unknown): this {
    if (isCacheableDependency(other)) {
      this.addCacheContexts(other.getCacheContexts());
      this.addCacheTags(other.getCacheTags());
      this.mergeCacheMaxAge(other.getCacheMaxAge());
    } else {
      // Not a cacheable dependency: it cannot be cached.
      // (Drupal triggers a deprecation here; treat as uncacheable.)
      this.cacheMaxAge = 0;
    }
    return this;
  }

  addCacheContexts(cacheContexts: string[]): this {
    if (cacheContexts.length > 0) {
      this.cacheContexts = Cache.mergeContexts(this.cacheContexts, cacheContexts);
    }
    return this;
  }

  addCacheTags(cacheTags: string[]): this {
    if (cacheTags.length > 0) {
      this.cacheTags = Cache.mergeTags(this.cacheTags, cacheTags);
    }
    return this;
  }

  mergeCacheMaxAge(maxAge: number): this {
    this.cacheMaxAge = Cache.mergeMaxAges(this.cacheMaxAge, maxAge);
    return this;
  }

  /**
   * Merges another object's values with this one.
   *
   * @returns A new `CacheableMetadata` with the merged data (this is unchanged).
   */
  merge(other: CacheableMetadata): this {
    // Clone `this` (preserving subclass identity and any extra fields, e.g.
    // ContextCacheKeys.keys), mirroring PHP's `clone $this`.
    const result = Object.create(
      Object.getPrototypeOf(this) as object,
    ) as this;
    Object.assign(result, this);

    // Contexts: avoid merging unless both sides are non-empty.
    if (this.cacheContexts.length === 0) {
      result.cacheContexts = other.cacheContexts;
    } else if (other.cacheContexts.length === 0) {
      result.cacheContexts = this.cacheContexts;
    } else {
      result.cacheContexts = Cache.mergeContexts(
        this.cacheContexts,
        other.cacheContexts,
      );
    }

    // Tags: same short-circuit.
    if (this.cacheTags.length === 0) {
      result.cacheTags = other.cacheTags;
    } else if (other.cacheTags.length === 0) {
      result.cacheTags = this.cacheTags;
    } else {
      result.cacheTags = Cache.mergeTags(this.cacheTags, other.cacheTags);
    }

    // Max-age: permanent on one side defers to the other.
    if (this.cacheMaxAge === CACHE_PERMANENT) {
      result.cacheMaxAge = other.cacheMaxAge;
    } else if (other.cacheMaxAge === CACHE_PERMANENT) {
      result.cacheMaxAge = this.cacheMaxAge;
    } else {
      result.cacheMaxAge = Cache.mergeMaxAges(this.cacheMaxAge, other.cacheMaxAge);
    }

    return result;
  }

  /**
   * Applies these values to a render array's `#cache` key.
   *
   * @param build - The render array to mutate.
   */
  applyTo(build: Record<string, unknown>): void {
    build['#cache'] = {
      contexts: this.cacheContexts,
      tags: this.cacheTags,
      'max-age': this.cacheMaxAge,
    };
  }

  /** Creates metadata from a render array's `#cache` key. */
  static createFromRenderArray(build: Record<string, unknown>): CacheableMetadata {
    const cache = (build['#cache'] ?? {}) as {
      contexts?: string[];
      tags?: string[];
      'max-age'?: number;
    };
    const meta = new CacheableMetadata();
    meta.cacheContexts = cache.contexts ?? [];
    meta.cacheTags = cache.tags ?? [];
    meta.cacheMaxAge = cache['max-age'] ?? CACHE_PERMANENT;
    return meta;
  }

  /**
   * Creates metadata from an arbitrary object.
   *
   * If the object is a {@link CacheableDependencyInterface}, its metadata is
   * copied; otherwise it is assumed uncacheable and given max-age 0.
   */
  static createFromObject(object: unknown): CacheableMetadata {
    const meta = new CacheableMetadata();
    if (isCacheableDependency(object)) {
      meta.cacheContexts = object.getCacheContexts();
      meta.cacheTags = object.getCacheTags();
      meta.cacheMaxAge = object.getCacheMaxAge();
      return meta;
    }
    meta.cacheMaxAge = 0;
    return meta;
  }
}
