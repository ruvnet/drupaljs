import { describe, it, expect } from 'vitest';
import { Cache, CACHE_PERMANENT } from './cache.js';

describe('Cache helpers', () => {
  it('CACHE_PERMANENT is -1', () => {
    expect(CACHE_PERMANENT).toBe(-1);
  });

  describe('mergeTags', () => {
    it('merges and de-duplicates tags preserving order', () => {
      expect(Cache.mergeTags(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty list when given no tags', () => {
      expect(Cache.mergeTags([], [])).toEqual([]);
    });
  });

  describe('mergeContexts', () => {
    it('merges and de-duplicates contexts', () => {
      expect(Cache.mergeContexts(['user', 'url'], ['url', 'theme'])).toEqual([
        'user',
        'url',
        'theme',
      ]);
    });
  });

  describe('mergeMaxAges', () => {
    it('returns the lowest finite max-age', () => {
      expect(Cache.mergeMaxAges(60, 30, 120)).toBe(30);
    });

    it('ignores PERMANENT (-1) values when a finite age exists', () => {
      expect(Cache.mergeMaxAges(CACHE_PERMANENT, 90)).toBe(90);
    });

    it('returns PERMANENT when all ages are PERMANENT', () => {
      expect(Cache.mergeMaxAges(CACHE_PERMANENT, CACHE_PERMANENT)).toBe(CACHE_PERMANENT);
    });

    it('treats max-age 0 (uncacheable) as the minimum', () => {
      expect(Cache.mergeMaxAges(0, 100)).toBe(0);
    });
  });
});
