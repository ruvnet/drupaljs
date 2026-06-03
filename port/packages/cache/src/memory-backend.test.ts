import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryBackend } from './memory-backend.js';
import { CACHE_PERMANENT, type TimeInterface } from './cache-backend-interface.js';

/** Controllable TimeInterface stub (Drupal time is in Unix seconds). */
class StubTime implements TimeInterface {
  constructor(private seconds: number) {}
  getRequestTime(): number {
    return this.seconds;
  }
  set(seconds: number): void {
    this.seconds = seconds;
  }
}

describe('MemoryBackend', () => {
  let time: StubTime;
  let backend: MemoryBackend;

  beforeEach(() => {
    time = new StubTime(1000);
    backend = new MemoryBackend(time);
  });

  describe('get / set', () => {
    it('returns false on a miss', () => {
      expect(backend.get('absent')).toBe(false);
    });

    it('round-trips a stored value with metadata', () => {
      backend.set('k', { hello: 'world' });
      const item = backend.get<{ hello: string }>('k');
      expect(item).not.toBe(false);
      if (item === false) throw new Error('expected hit');
      expect(item.cid).toBe('k');
      expect(item.data).toEqual({ hello: 'world' });
      expect(item.created).toBe(1000);
      expect(item.expire).toBe(CACHE_PERMANENT);
      expect(item.valid).toBe(true);
    });

    it('isolates returned data from the stored copy (no aliasing)', () => {
      const stored = { count: 1, nested: { x: 1 } };
      backend.set('k', stored);

      // Mutating the original after set must not affect the cache.
      stored.count = 99;
      stored.nested.x = 99;

      const item = backend.get<{ count: number; nested: { x: number } }>('k');
      if (item === false) throw new Error('expected hit');
      expect(item.data.count).toBe(1);
      expect(item.data.nested.x).toBe(1);

      // Mutating a returned item must not affect subsequent reads.
      item.data.count = 7;
      const again = backend.get<{ count: number }>('k');
      if (again === false) throw new Error('expected hit');
      expect(again.data.count).toBe(1);
    });

    it('sorts and de-duplicates tags on set', () => {
      backend.set('k', 'v', CACHE_PERMANENT, ['user:2', 'node:1', 'user:2']);
      const item = backend.get('k');
      if (item === false) throw new Error('expected hit');
      expect(item.tags).toEqual(['node:1', 'user:2']);
    });
  });

  describe('expiry', () => {
    it('hides expired items unless allowInvalid is true', () => {
      backend.set('k', 'v', 1500); // expires at t=1500
      time.set(1600); // now past expiry
      expect(backend.get('k')).toBe(false);

      const invalid = backend.get('k', true);
      if (invalid === false) throw new Error('expected stale hit');
      expect(invalid.valid).toBe(false);
      expect(invalid.data).toBe('v');
    });

    it('keeps an item valid up to and including its expiry second', () => {
      backend.set('k', 'v', 1500);
      time.set(1500);
      const item = backend.get('k');
      if (item === false) throw new Error('expected hit');
      expect(item.valid).toBe(true);
    });
  });

  describe('getMultiple', () => {
    it('returns hits keyed by cid and removes them from the cids array', () => {
      backend.set('a', 1);
      backend.set('b', 2);
      const cids = ['a', 'b', 'missing'];
      const result = backend.getMultiple<number>(cids);

      expect(Object.keys(result).sort()).toEqual(['a', 'b']);
      expect(result.a?.data).toBe(1);
      expect(result.b?.data).toBe(2);
      // Input array mutated: only the miss remains.
      expect(cids).toEqual(['missing']);
    });

    it('omits expired items unless allowInvalid is set', () => {
      backend.set('a', 1, 1500);
      time.set(1600);
      const cids = ['a'];
      expect(Object.keys(backend.getMultiple(cids))).toEqual([]);
      expect(cids).toEqual(['a']); // not removed, still a miss

      const cids2 = ['a'];
      const withInvalid = backend.getMultiple(cids2, true);
      expect(withInvalid.a?.valid).toBe(false);
      expect(cids2).toEqual([]);
    });
  });

  describe('setMultiple', () => {
    it('stores several items with optional expire/tags', () => {
      backend.setMultiple({
        a: { data: 1 },
        b: { data: 2, expire: 2000, tags: ['t'] },
      });
      expect((backend.get('a') as { data: number }).data).toBe(1);
      const b = backend.get('b');
      if (b === false) throw new Error('expected hit');
      expect(b.expire).toBe(2000);
      expect(b.tags).toEqual(['t']);
    });
  });

  describe('delete', () => {
    it('removes a single item', () => {
      backend.set('a', 1);
      backend.delete('a');
      expect(backend.get('a')).toBe(false);
    });

    it('removes multiple items', () => {
      backend.set('a', 1);
      backend.set('b', 2);
      backend.set('c', 3);
      backend.deleteMultiple(['a', 'c']);
      expect(backend.get('a')).toBe(false);
      expect(backend.get('c')).toBe(false);
      expect(backend.get('b')).not.toBe(false);
    });

    it('removes all items', () => {
      backend.set('a', 1);
      backend.set('b', 2);
      backend.deleteAll();
      expect(backend.get('a')).toBe(false);
      expect(backend.get('b')).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('marks a single item invalid but still retrievable with allowInvalid', () => {
      backend.set('a', 1);
      backend.invalidate('a');
      expect(backend.get('a')).toBe(false);
      expect((backend.get('a', true) as { valid: boolean }).valid).toBe(false);
    });

    it('marks multiple items invalid', () => {
      backend.set('a', 1);
      backend.set('b', 2);
      backend.invalidateMultiple(['a', 'b']);
      expect(backend.get('a')).toBe(false);
      expect(backend.get('b')).toBe(false);
    });

    it('is a no-op for unknown cids', () => {
      expect(() => backend.invalidate('nope')).not.toThrow();
    });
  });

  describe('invalidateTags', () => {
    it('invalidates every item carrying any of the given tags', () => {
      backend.set('a', 1, CACHE_PERMANENT, ['node:1']);
      backend.set('b', 2, CACHE_PERMANENT, ['node:2']);
      backend.set('c', 3, CACHE_PERMANENT, ['node:1', 'user:5']);

      backend.invalidateTags(['node:1']);

      expect(backend.get('a')).toBe(false);
      expect(backend.get('c')).toBe(false);
      expect(backend.get('b')).not.toBe(false);
    });
  });

  describe('garbageCollection', () => {
    it('drops expired items and keeps permanent/valid ones', () => {
      backend.set('perm', 1, CACHE_PERMANENT);
      backend.set('valid', 2, 2000);
      backend.set('stale', 3, 1500);

      time.set(1600);
      backend.garbageCollection();

      // allowInvalid would still miss truly-removed items.
      expect(backend.get('stale', true)).toBe(false);
      expect(backend.get('perm', true)).not.toBe(false);
      expect(backend.get('valid', true)).not.toBe(false);
    });
  });

  describe('removeBin', () => {
    it('clears the entire bin', () => {
      backend.set('a', 1);
      backend.removeBin();
      expect(backend.get('a', true)).toBe(false);
    });
  });
});
