import { describe, it, expect } from 'vitest';
import { MediaLibraryState, BadRequestError } from './media-library-state.js';
import type { HashSigner, RequestQuery } from './types.js';

/** Deterministic signer: a stable, order-independent stand-in for HMAC. */
const signer: HashSigner = {
  sign: (data: string) => `sig(${data})`,
};

const valid = () =>
  MediaLibraryState.create('opener.test', ['image', 'document'], 'image', 1, {}, signer);

describe('MediaLibraryState.create / accessors', () => {
  it('exposes the required parameters via typed getters', () => {
    const state = valid();
    expect(state.getOpenerId()).toBe('opener.test');
    expect(state.getAllowedTypeIds()).toEqual(['image', 'document']);
    expect(state.getSelectedTypeId()).toBe('image');
    expect(state.getAvailableSlots()).toBe(1);
    expect(state.getOpenerParameters()).toEqual({});
  });

  it('coerces remaining slots to an int (getAvailableSlots)', () => {
    const state = MediaLibraryState.create('o', ['image'], 'image', '3', {}, signer);
    expect(state.getAvailableSlots()).toBe(3);
  });

  it('reports slot availability (0 = none, negative = unlimited)', () => {
    expect(MediaLibraryState.create('o', ['image'], 'image', 0, {}, signer).hasSlotsAvailable()).toBe(false);
    expect(MediaLibraryState.create('o', ['image'], 'image', -1, {}, signer).hasSlotsAvailable()).toBe(true);
    expect(MediaLibraryState.create('o', ['image'], 'image', 2, {}, signer).hasSlotsAvailable()).toBe(true);
  });
});

describe('MediaLibraryState validation', () => {
  it('rejects an empty opener id', () => {
    expect(() => MediaLibraryState.create('  ', ['image'], 'image', 1, {}, signer)).toThrow(/opener ID/i);
  });

  it('rejects an empty / non-array allowed types', () => {
    expect(() => MediaLibraryState.create('o', [], 'image', 1, {}, signer)).toThrow(/allowed types/i);
    expect(() => MediaLibraryState.create('o', ['image', ' '], 'image', 1, {}, signer)).toThrow(/allowed types/i);
  });

  it('rejects an empty selected type', () => {
    expect(() => MediaLibraryState.create('o', ['image'], '', 1, {}, signer)).toThrow(/selected type/i);
  });

  it('requires the selected type to be among the allowed types', () => {
    expect(() => MediaLibraryState.create('o', ['image'], 'video', 1, {}, signer)).toThrow(/present in the list/i);
  });

  it('rejects non-numeric remaining slots', () => {
    expect(() => MediaLibraryState.create('o', ['image'], 'image', 'abc', {}, signer)).toThrow(/remaining slots/i);
  });
});

describe('MediaLibraryState hashing (tamper protection)', () => {
  it('produces an order-independent hash for allowed types and opener params', () => {
    const a = MediaLibraryState.create('o', ['image', 'document'], 'image', 1, { b: 2, a: 1 }, signer);
    const b = MediaLibraryState.create('o', ['document', 'image'], 'image', 1, { a: 1, b: 2 }, signer);
    expect(a.getHash()).toBe(b.getHash());
  });

  it('changes the hash when a meaningful parameter changes', () => {
    const a = MediaLibraryState.create('o', ['image'], 'image', 1, {}, signer);
    const b = MediaLibraryState.create('o', ['image'], 'image', 2, {}, signer);
    expect(a.getHash()).not.toBe(b.getHash());
  });

  it('validates its own hash and rejects a bad one', () => {
    const state = valid();
    expect(state.isValidHash(state.getHash())).toBe(true);
    expect(state.isValidHash('tampered')).toBe(false);
  });

  it('stores the computed hash under the "hash" key on construction', () => {
    const state = valid();
    expect(state.get('hash')).toBe(state.getHash());
  });
});

describe('MediaLibraryState.fromRequest', () => {
  const buildQuery = (overrides: Record<string, any> = {}): RequestQuery => {
    const base: Record<string, any> = {
      media_library_opener_id: 'opener.test',
      media_library_allowed_types: ['image', 'document'],
      media_library_selected_type: 'image',
      media_library_remaining: '1',
      media_library_opener_parameters: {},
      extra_param: 'kept',
      ...overrides,
    };
    return {
      get: (k) => (Array.isArray(base[k]) || typeof base[k] === 'object' ? undefined : base[k]),
      all: (k) => (k === undefined ? base : base[k] ?? []),
    };
  };

  it('reconstructs a state and keeps extra (non-required) query params', () => {
    const reference = valid();
    const query = buildQuery({ hash: reference.getHash() });
    const state = MediaLibraryState.fromRequest(query, signer);
    expect(state.getOpenerId()).toBe('opener.test');
    expect(state.get('extra_param')).toBe('kept');
  });

  it('throws BadRequestError when the hash is invalid', () => {
    const query = buildQuery({ hash: 'not-the-real-hash' });
    expect(() => MediaLibraryState.fromRequest(query, signer)).toThrow(BadRequestError);
  });
});

describe('MediaLibraryState cacheability', () => {
  it('exposes the url.query_args cache context and permanent max-age', () => {
    const state = valid();
    expect(state.getCacheContexts()).toEqual(['url.query_args']);
    expect(state.getCacheTags()).toEqual([]);
    expect(state.getCacheMaxAge()).toBe(MediaLibraryState.CACHE_PERMANENT);
  });
});
