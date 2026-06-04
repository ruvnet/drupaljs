import { describe, it, expect, vi } from 'vitest';
import { CacheTagsInvalidator } from './cache-tags-invalidator.js';
import type { CacheTagsInvalidatorInterface } from './cache-tags-invalidator-interface.js';
import type { CacheBackendInterface } from './cache-backend-interface.js';

/** A backend mock that also handles tag invalidation. */
function makeInvalidatingBackend(): CacheBackendInterface &
  CacheTagsInvalidatorInterface {
  return {
    invalidateTags: vi.fn(),
    get: vi.fn(),
    getMultiple: vi.fn(),
    set: vi.fn(),
    setMultiple: vi.fn(),
    delete: vi.fn(),
    deleteMultiple: vi.fn(),
    deleteAll: vi.fn(),
    invalidate: vi.fn(),
    invalidateMultiple: vi.fn(),
    garbageCollection: vi.fn(),
    removeBin: vi.fn(),
  } as unknown as CacheBackendInterface & CacheTagsInvalidatorInterface;
}

describe('CacheTagsInvalidator', () => {
  it('forwards invalidateTags to every registered invalidator', () => {
    const invalidator = new CacheTagsInvalidator();
    const a: CacheTagsInvalidatorInterface = { invalidateTags: vi.fn() };
    const b: CacheTagsInvalidatorInterface = { invalidateTags: vi.fn() };
    invalidator.addInvalidator(a);
    invalidator.addInvalidator(b);

    invalidator.invalidateTags(['node:1', 'user:2']);

    expect(a.invalidateTags).toHaveBeenCalledWith(['node:1', 'user:2']);
    expect(b.invalidateTags).toHaveBeenCalledWith(['node:1', 'user:2']);
  });

  it('forwards invalidateTags to registered bins that support invalidation', () => {
    const invalidator = new CacheTagsInvalidator();
    const bin = makeInvalidatingBackend();
    invalidator.addBin(bin);

    invalidator.invalidateTags(['node:1']);

    expect(bin.invalidateTags).toHaveBeenCalledWith(['node:1']);
  });

  it('ignores bins that do not implement CacheTagsInvalidatorInterface', () => {
    const invalidator = new CacheTagsInvalidator();
    // A backend with NO invalidateTags method must not be registered as a bin.
    const plainBackend = {
      get: vi.fn(),
      getMultiple: vi.fn(),
      set: vi.fn(),
      setMultiple: vi.fn(),
      delete: vi.fn(),
      deleteMultiple: vi.fn(),
      deleteAll: vi.fn(),
      invalidate: vi.fn(),
      invalidateMultiple: vi.fn(),
      garbageCollection: vi.fn(),
      removeBin: vi.fn(),
    } as unknown as CacheBackendInterface;

    invalidator.addBin(plainBackend);
    // No throw, and nothing to forward to.
    expect(() => invalidator.invalidateTags(['x'])).not.toThrow();
  });

  it('purges only invalidators that implement purge()', () => {
    const invalidator = new CacheTagsInvalidator();
    const purgeable = { invalidateTags: vi.fn(), purge: vi.fn() };
    const plain: CacheTagsInvalidatorInterface = { invalidateTags: vi.fn() };
    invalidator.addInvalidator(purgeable);
    invalidator.addInvalidator(plain);

    invalidator.purge();

    expect(purgeable.purge).toHaveBeenCalledOnce();
  });

  it('resetChecksums() resets only checksum-providing invalidators', () => {
    const invalidator = new CacheTagsInvalidator();
    const checksum = {
      invalidateTags: vi.fn(),
      getCurrentChecksum: vi.fn(),
      isValid: vi.fn(),
      reset: vi.fn(),
    };
    const plain: CacheTagsInvalidatorInterface = { invalidateTags: vi.fn() };
    invalidator.addInvalidator(checksum);
    invalidator.addInvalidator(plain);

    invalidator.resetChecksums();

    expect(checksum.reset).toHaveBeenCalledOnce();
  });
});
