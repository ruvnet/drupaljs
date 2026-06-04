import { describe, it, expect } from 'vitest';
import {
  TsChecksumProvider,
  INVALID_CHECKSUM_WHILE_IN_TRANSACTION,
} from './checksum.js';

describe('TsChecksumProvider (CacheTagsChecksumInterface port)', () => {
  it('starts every tag at checksum 0', () => {
    const checksum = new TsChecksumProvider();
    expect(checksum.getCurrentChecksum(['node:1', 'user:2'])).toBe(0);
  });

  it('increments the checksum when a tag is invalidated', () => {
    const checksum = new TsChecksumProvider();
    checksum.invalidateTags(['node:1']);
    expect(checksum.getCurrentChecksum(['node:1'])).toBe(1);
    checksum.invalidateTags(['node:1']);
    expect(checksum.getCurrentChecksum(['node:1'])).toBe(2);
  });

  it('sums invalidation counts across all requested tags', () => {
    const checksum = new TsChecksumProvider();
    checksum.invalidateTags(['node:1']);
    checksum.invalidateTags(['user:2']);
    checksum.invalidateTags(['user:2']);
    expect(checksum.getCurrentChecksum(['node:1', 'user:2'])).toBe(3);
  });

  it('does not count tags that were never invalidated', () => {
    const checksum = new TsChecksumProvider();
    checksum.invalidateTags(['node:1']);
    expect(checksum.getCurrentChecksum(['node:1', 'untouched'])).toBe(1);
  });

  describe('isValid', () => {
    it('is valid when no invalidation happened since the checksum was taken', () => {
      const checksum = new TsChecksumProvider();
      const stored = checksum.getCurrentChecksum(['node:1']);
      expect(checksum.isValid(stored, ['node:1'])).toBe(true);
    });

    it('is invalid once a relevant tag is invalidated after storing', () => {
      const checksum = new TsChecksumProvider();
      const stored = checksum.getCurrentChecksum(['node:1']);
      checksum.invalidateTags(['node:1']);
      expect(checksum.isValid(stored, ['node:1'])).toBe(false);
    });

    it('treats the in-transaction sentinel checksum as never valid', () => {
      const checksum = new TsChecksumProvider();
      expect(
        checksum.isValid(INVALID_CHECKSUM_WHILE_IN_TRANSACTION, ['node:1']),
      ).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all invalidation counts', () => {
      const checksum = new TsChecksumProvider();
      checksum.invalidateTags(['node:1']);
      checksum.reset();
      expect(checksum.getCurrentChecksum(['node:1'])).toBe(0);
    });
  });
});
