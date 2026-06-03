import { describe, it, expect } from 'vitest';
import { CacheableMetadata } from './cacheable-metadata.js';
import type { CacheableDependencyInterface } from './cacheable-metadata.js';
import { CACHE_PERMANENT } from './cache-backend-interface.js';

/** A simple cacheable dependency for createFromObject / addCacheableDependency. */
function dep(
  contexts: string[],
  tags: string[],
  maxAge: number,
): CacheableDependencyInterface {
  return {
    getCacheContexts: () => contexts,
    getCacheTags: () => tags,
    getCacheMaxAge: () => maxAge,
  };
}

describe('CacheableMetadata', () => {
  it('defaults to empty contexts/tags and PERMANENT max-age', () => {
    const meta = new CacheableMetadata();
    expect(meta.getCacheContexts()).toEqual([]);
    expect(meta.getCacheTags()).toEqual([]);
    expect(meta.getCacheMaxAge()).toBe(CACHE_PERMANENT);
  });

  describe('setters return this (fluent)', () => {
    it('sets contexts, tags and max-age', () => {
      const meta = new CacheableMetadata();
      expect(meta.setCacheContexts(['user'])).toBe(meta);
      expect(meta.setCacheTags(['node:1'])).toBe(meta);
      expect(meta.setCacheMaxAge(60)).toBe(meta);
      expect(meta.getCacheContexts()).toEqual(['user']);
      expect(meta.getCacheTags()).toEqual(['node:1']);
      expect(meta.getCacheMaxAge()).toBe(60);
    });

    it('throws when setCacheMaxAge gets a non-integer', () => {
      const meta = new CacheableMetadata();
      expect(() => meta.setCacheMaxAge(1.5)).toThrow();
    });
  });

  describe('refinable adders', () => {
    it('adds and de-duplicates contexts and tags', () => {
      const meta = new CacheableMetadata();
      meta.addCacheContexts(['a', 'b']).addCacheContexts(['b', 'c']);
      meta.addCacheTags(['t1']).addCacheTags(['t1', 't2']);
      expect(meta.getCacheContexts()).toEqual(['a', 'b', 'c']);
      expect(meta.getCacheTags()).toEqual(['t1', 't2']);
    });

    it('mergeCacheMaxAge keeps the lowest finite max-age', () => {
      const meta = new CacheableMetadata();
      meta.mergeCacheMaxAge(3600);
      expect(meta.getCacheMaxAge()).toBe(3600);
      meta.mergeCacheMaxAge(60);
      expect(meta.getCacheMaxAge()).toBe(60);
    });

    it('addCacheableDependency folds another dependency in', () => {
      const meta = new CacheableMetadata().setCacheMaxAge(3600);
      meta.addCacheableDependency(dep(['user'], ['node:1'], 60));
      expect(meta.getCacheContexts()).toEqual(['user']);
      expect(meta.getCacheTags()).toEqual(['node:1']);
      expect(meta.getCacheMaxAge()).toBe(60);
    });
  });

  describe('merge', () => {
    it('returns a new object combining both, leaving the receiver unchanged', () => {
      const a = new CacheableMetadata()
        .setCacheContexts(['user'])
        .setCacheTags(['node:1'])
        .setCacheMaxAge(3600);
      const b = new CacheableMetadata()
        .setCacheContexts(['theme'])
        .setCacheTags(['node:2'])
        .setCacheMaxAge(60);

      const merged = a.merge(b);

      expect(merged).not.toBe(a);
      expect(merged.getCacheContexts()).toEqual(['user', 'theme']);
      expect(merged.getCacheTags()).toEqual(['node:1', 'node:2']);
      expect(merged.getCacheMaxAge()).toBe(60);

      // Receiver untouched.
      expect(a.getCacheContexts()).toEqual(['user']);
      expect(a.getCacheMaxAge()).toBe(3600);
    });

    it('takes the other side when one side is empty/permanent', () => {
      const empty = new CacheableMetadata();
      const full = new CacheableMetadata()
        .setCacheContexts(['user'])
        .setCacheTags(['node:1'])
        .setCacheMaxAge(60);

      const merged = empty.merge(full);
      expect(merged.getCacheContexts()).toEqual(['user']);
      expect(merged.getCacheTags()).toEqual(['node:1']);
      expect(merged.getCacheMaxAge()).toBe(60);
    });
  });

  describe('render array interop', () => {
    it('applyTo writes #cache keys', () => {
      const meta = new CacheableMetadata()
        .setCacheContexts(['user'])
        .setCacheTags(['node:1'])
        .setCacheMaxAge(60);
      const build: Record<string, unknown> = {};
      meta.applyTo(build);
      expect(build['#cache']).toEqual({
        contexts: ['user'],
        tags: ['node:1'],
        'max-age': 60,
      });
    });

    it('createFromRenderArray reads #cache keys with sensible defaults', () => {
      const meta = CacheableMetadata.createFromRenderArray({
        '#cache': { contexts: ['user'], tags: ['node:1'] },
      });
      expect(meta.getCacheContexts()).toEqual(['user']);
      expect(meta.getCacheTags()).toEqual(['node:1']);
      expect(meta.getCacheMaxAge()).toBe(CACHE_PERMANENT);

      const empty = CacheableMetadata.createFromRenderArray({});
      expect(empty.getCacheContexts()).toEqual([]);
      expect(empty.getCacheMaxAge()).toBe(CACHE_PERMANENT);
    });
  });

  describe('createFromObject', () => {
    it('copies metadata from a cacheable dependency', () => {
      const meta = CacheableMetadata.createFromObject(
        dep(['user'], ['node:1'], 60),
      );
      expect(meta.getCacheContexts()).toEqual(['user']);
      expect(meta.getCacheTags()).toEqual(['node:1']);
      expect(meta.getCacheMaxAge()).toBe(60);
    });

    it('treats non-cacheable objects as uncacheable (max-age 0)', () => {
      const meta = CacheableMetadata.createFromObject({ not: 'cacheable' });
      expect(meta.getCacheContexts()).toEqual([]);
      expect(meta.getCacheTags()).toEqual([]);
      expect(meta.getCacheMaxAge()).toBe(0);
    });
  });
});
