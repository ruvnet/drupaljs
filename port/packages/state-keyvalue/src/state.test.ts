import { describe, it, expect } from 'vitest';
import { MemoryKeyValueStore, MemoryKeyValueFactory, State } from './index.js';

describe('MemoryKeyValueStore', () => {
  it('set/get round-trips values', () => {
    const store = new MemoryKeyValueStore();
    store.set('key1', 'value1');
    expect(store.get('key1')).toBe('value1');
  });
  it('get returns undefined for missing key', () => {
    expect(new MemoryKeyValueStore().get('missing')).toBeUndefined();
  });
  it('getMultiple returns only existing keys', () => {
    const store = new MemoryKeyValueStore();
    store.set('a', 1); store.set('b', 2);
    const result = store.getMultiple(['a', 'b', 'c']);
    expect(result).toEqual({ a: 1, b: 2 });
  });
  it('getAll returns all entries', () => {
    const store = new MemoryKeyValueStore();
    store.set('x', 10); store.set('y', 20);
    expect(store.getAll()).toEqual({ x: 10, y: 20 });
  });
  it('setMany sets multiple keys', () => {
    const store = new MemoryKeyValueStore();
    store.setMany({ p: 1, q: 2 });
    expect(store.get('p')).toBe(1);
    expect(store.get('q')).toBe(2);
  });
  it('setIfNotExists returns true and sets when key is absent', () => {
    const store = new MemoryKeyValueStore();
    expect(store.setIfNotExists('k', 'v')).toBe(true);
    expect(store.get('k')).toBe('v');
  });
  it('setIfNotExists returns false and does not overwrite when key exists', () => {
    const store = new MemoryKeyValueStore();
    store.set('k', 'original');
    expect(store.setIfNotExists('k', 'new')).toBe(false);
    expect(store.get('k')).toBe('original');
  });
  it('rename moves value to new key', () => {
    const store = new MemoryKeyValueStore();
    store.set('old', 'val');
    store.rename('old', 'new');
    expect(store.get('old')).toBeUndefined();
    expect(store.get('new')).toBe('val');
  });
  it('delete removes key', () => {
    const store = new MemoryKeyValueStore();
    store.set('k', 'v');
    store.delete('k');
    expect(store.get('k')).toBeUndefined();
  });
  it('deleteMultiple removes multiple keys', () => {
    const store = new MemoryKeyValueStore();
    store.set('a', 1); store.set('b', 2); store.set('c', 3);
    store.deleteMultiple(['a', 'b']);
    expect(store.get('a')).toBeUndefined();
    expect(store.get('c')).toBe(3);
  });
  it('deleteAll clears all', () => {
    const store = new MemoryKeyValueStore();
    store.set('a', 1); store.set('b', 2);
    store.deleteAll();
    expect(store.getAll()).toEqual({});
  });
});

describe('MemoryKeyValueFactory', () => {
  it('returns same store instance for same collection', () => {
    const factory = new MemoryKeyValueFactory();
    expect(factory.get('state')).toBe(factory.get('state'));
  });
  it('returns different stores for different collections', () => {
    const factory = new MemoryKeyValueFactory();
    expect(factory.get('a')).not.toBe(factory.get('b'));
  });
});

describe('State', () => {
  it('get/set stores and retrieves values', () => {
    const state = new State(new MemoryKeyValueStore());
    state.set('system.cron_last', 1234567890);
    expect(state.get('system.cron_last')).toBe(1234567890);
  });
  it('get caches values from store', () => {
    const store = new MemoryKeyValueStore();
    store.set('cached_key', 'cached_value');
    const state = new State(store);
    state.get('cached_key'); // prime cache
    store.set('cached_key', 'new_value'); // change underlying store
    expect(state.get('cached_key')).toBe('cached_value'); // still cached
  });
  it('resetCache() forces re-read from store', () => {
    const store = new MemoryKeyValueStore();
    store.set('k', 'v1');
    const state = new State(store);
    state.get('k');
    store.set('k', 'v2');
    state.resetCache();
    expect(state.get('k')).toBe('v2');
  });
  it('delete removes from cache and store', () => {
    const state = new State(new MemoryKeyValueStore());
    state.set('k', 'v');
    state.delete('k');
    expect(state.get('k')).toBeUndefined();
  });
  it('getMultiple works with cache and store', () => {
    const state = new State(new MemoryKeyValueStore());
    state.setMultiple({ a: 1, b: 2 });
    const result = state.getMultiple(['a', 'b', 'c']);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
