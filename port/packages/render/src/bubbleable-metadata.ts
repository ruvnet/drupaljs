/**
 * Value object for bubbleable rendering metadata.
 *
 * Port of Drupal\Core\Render\BubbleableMetadata (which extends
 * Drupal\Core\Cache\CacheableMetadata and mixes in AttachmentsTrait). It carries
 * cache tags, cache contexts, a max-age, and attached assets that "bubble" up
 * the render tree as elements are rendered.
 */

import { Cache, CACHE_PERMANENT } from './cache.js';
import type { RenderArray } from './render-array.js';

/**
 * The `#attached` structure: assets/settings keyed by type. Values are merged
 * recursively, with `drupalSettings` and `placeholders` merged specially.
 */
export type Attachments = Record<string, unknown> & {
  drupalSettings?: Record<string, unknown>;
  placeholders?: Record<string, unknown>;
};

/** Deep-merge plain objects (mirrors NestedArray::mergeDeepArray for objects). */
function mergeDeep(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [key, bVal] of Object.entries(b)) {
    const aVal = out[key];
    if (isPlainObject(aVal) && isPlainObject(bVal)) {
      out[key] = mergeDeep(aVal, bVal);
    } else {
      out[key] = bVal;
    }
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export class BubbleableMetadata {
  protected cacheTags: string[] = [];
  protected cacheContexts: string[] = [];
  protected cacheMaxAge: number = CACHE_PERMANENT;
  protected attachments: Attachments = {};

  getCacheTags(): string[] {
    return this.cacheTags;
  }

  setCacheTags(tags: string[]): this {
    this.cacheTags = tags;
    return this;
  }

  getCacheContexts(): string[] {
    return this.cacheContexts;
  }

  setCacheContexts(contexts: string[]): this {
    this.cacheContexts = contexts;
    return this;
  }

  getCacheMaxAge(): number {
    return this.cacheMaxAge;
  }

  setCacheMaxAge(maxAge: number): this {
    if (!Number.isInteger(maxAge)) {
      throw new TypeError('max-age must be an integer');
    }
    this.cacheMaxAge = maxAge;
    return this;
  }

  getAttachments(): Attachments {
    return this.attachments;
  }

  setAttachments(attachments: Attachments): this {
    this.attachments = attachments;
    return this;
  }

  addAttachments(attachments: Attachments): this {
    this.attachments = BubbleableMetadata.mergeAttachments(this.attachments, attachments);
    return this;
  }

  /** Returns a NEW metadata object merging this one with `other` (immutable). */
  merge(other: BubbleableMetadata): BubbleableMetadata {
    const result = new BubbleableMetadata();

    // Avoid unnecessary merges (parity with Drupal's hot-path optimization).
    if (this.cacheContexts.length === 0) {
      result.cacheContexts = other.cacheContexts;
    } else if (other.cacheContexts.length === 0) {
      result.cacheContexts = this.cacheContexts;
    } else {
      result.cacheContexts = Cache.mergeContexts(this.cacheContexts, other.cacheContexts);
    }

    if (this.cacheTags.length === 0) {
      result.cacheTags = other.cacheTags;
    } else if (other.cacheTags.length === 0) {
      result.cacheTags = this.cacheTags;
    } else {
      result.cacheTags = Cache.mergeTags(this.cacheTags, other.cacheTags);
    }

    if (this.cacheMaxAge === CACHE_PERMANENT) {
      result.cacheMaxAge = other.cacheMaxAge;
    } else if (other.cacheMaxAge === CACHE_PERMANENT) {
      result.cacheMaxAge = this.cacheMaxAge;
    } else {
      result.cacheMaxAge = Cache.mergeMaxAges(this.cacheMaxAge, other.cacheMaxAge);
    }

    const aEmpty = Object.keys(this.attachments).length === 0;
    const bEmpty = Object.keys(other.attachments).length === 0;
    if (aEmpty) {
      result.attachments = other.attachments;
    } else if (bEmpty) {
      result.attachments = this.attachments;
    } else {
      result.attachments = BubbleableMetadata.mergeAttachments(this.attachments, other.attachments);
    }

    return result;
  }

  /** Applies this metadata onto a render array's #cache and #attached keys. */
  applyTo(build: RenderArray): void {
    build['#cache'] = {
      ...build['#cache'],
      contexts: this.cacheContexts,
      tags: this.cacheTags,
      'max-age': this.cacheMaxAge,
    };
    build['#attached'] = this.attachments;
  }

  /** Builds a metadata object from a render array's #cache/#attached. */
  static createFromRenderArray(build: RenderArray): BubbleableMetadata {
    const meta = new BubbleableMetadata();
    const cache = build['#cache'];
    meta.cacheContexts = cache?.contexts ?? [];
    meta.cacheTags = cache?.tags ?? [];
    meta.cacheMaxAge = cache?.['max-age'] ?? CACHE_PERMANENT;
    meta.attachments = build['#attached'] ?? {};
    return meta;
  }

  /**
   * Merges two #attached arrays.
   *
   * `drupalSettings` is deep-merged (jQuery.extend-style idempotency) and
   * `placeholders` is shallow-merged by key; everything else is concatenated
   * (array values) or merged recursively.
   */
  static mergeAttachments(a: Attachments, b: Attachments): Attachments {
    let drupalSettings: Record<string, unknown> | undefined;
    let placeholders: Record<string, unknown> | undefined;

    const aCopy: Attachments = { ...a };
    const bCopy: Attachments = { ...b };

    if (aCopy.drupalSettings && bCopy.drupalSettings) {
      drupalSettings = mergeDeep(aCopy.drupalSettings, bCopy.drupalSettings);
      delete aCopy.drupalSettings;
      delete bCopy.drupalSettings;
    }

    if (aCopy.placeholders && bCopy.placeholders) {
      placeholders = { ...aCopy.placeholders, ...bCopy.placeholders };
      delete aCopy.placeholders;
      delete bCopy.placeholders;
    }

    const result = mergeRecursive(aCopy, bCopy);

    if (drupalSettings) {
      result.drupalSettings = drupalSettings;
    }
    if (placeholders) {
      result.placeholders = placeholders;
    }
    return result as Attachments;
  }
}

/**
 * Recursive merge mirroring PHP's array_merge_recursive for the #attached use
 * case: array (list) values are concatenated; object values merge recursively;
 * scalars from b overwrite a.
 */
function mergeRecursive(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [key, bVal] of Object.entries(b)) {
    const aVal = out[key];
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      out[key] = [...aVal, ...bVal];
    } else if (isPlainObject(aVal) && isPlainObject(bVal)) {
      out[key] = mergeRecursive(aVal, bVal);
    } else {
      out[key] = bVal;
    }
  }
  return out;
}
