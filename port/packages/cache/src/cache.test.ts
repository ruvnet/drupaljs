import { describe, it, expect } from 'vitest';
import { Cache } from './cache.js';
import { CACHE_PERMANENT } from './cache-backend-interface.js';

describe('Cache (static helpers)', () => {
  describe('PERMANENT', () => {
    it('equals CACHE_PERMANENT (-1)', () => {
      expect(Cache.PERMANENT).toBe(CACHE_PERMANENT);
      expect(Cache.PERMANENT).toBe(-1);
    });
  });

  describe('mergeTags', () => {
    it('merges lists and removes duplicates preserving first-seen order', () => {
      expect(Cache.mergeTags(['node:1', 'user:2'], ['user:2', 'node:3'])).toEqual([
        'node:1',
        'user:2',
        'node:3',
      ]);
    });

    it('returns an empty list when given nothing', () => {
      expect(Cache.mergeTags()).toEqual([]);
    });

    it('handles a single list', () => {
      expect(Cache.mergeTags(['a', 'a', 'b'])).toEqual(['a', 'b']);
    });
  });

  describe('mergeContexts', () => {
    it('merges and de-duplicates context tokens', () => {
      expect(
        Cache.mergeContexts(['languages', 'user'], ['user', 'theme']),
      ).toEqual(['languages', 'user', 'theme']);
    });
  });

  describe('mergeMaxAges', () => {
    it('returns PERMANENT when all are permanent or empty', () => {
      expect(Cache.mergeMaxAges()).toBe(CACHE_PERMANENT);
      expect(Cache.mergeMaxAges(CACHE_PERMANENT, CACHE_PERMANENT)).toBe(
        CACHE_PERMANENT,
      );
    });

    it('finds the lowest finite max-age, ignoring PERMANENT', () => {
      expect(Cache.mergeMaxAges(CACHE_PERMANENT, 3600, 60)).toBe(60);
      expect(Cache.mergeMaxAges(0, 3600)).toBe(0);
    });
  });

  describe('buildTags', () => {
    it('joins prefix and suffixes with a colon by default', () => {
      expect(Cache.buildTags('node', ['1', '2', '3'])).toEqual([
        'node:1',
        'node:2',
        'node:3',
      ]);
    });

    it('supports a custom glue and coerces suffixes to strings', () => {
      expect(Cache.buildTags('config', [1, 2], '.')).toEqual([
        'config.1',
        'config.2',
      ]);
    });
  });
});
