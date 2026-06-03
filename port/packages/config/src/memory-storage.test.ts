import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from './memory-storage.js';
import { StorageInterface } from './storage.js';

describe('MemoryStorage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('reports the default collection name', () => {
    expect(storage.getCollectionName()).toBe(StorageInterface.DEFAULT_COLLECTION);
  });

  it('write/exists/read round-trips data', () => {
    expect(storage.exists('foo.bar')).toBe(false);
    expect(storage.write('foo.bar', { a: 1 })).toBe(true);
    expect(storage.exists('foo.bar')).toBe(true);
    expect(storage.read('foo.bar')).toEqual({ a: 1 });
  });

  it('read returns false for a missing object', () => {
    expect(storage.read('missing')).toBe(false);
  });

  it('readMultiple returns only existing objects keyed by name', () => {
    storage.write('a.one', { x: 1 });
    storage.write('a.two', { y: 2 });
    expect(storage.readMultiple(['a.one', 'a.two', 'a.three'])).toEqual({
      'a.one': { x: 1 },
      'a.two': { y: 2 },
    });
  });

  it('delete removes an object and reports success', () => {
    storage.write('foo.bar', { a: 1 });
    expect(storage.delete('foo.bar')).toBe(true);
    expect(storage.exists('foo.bar')).toBe(false);
    expect(storage.delete('foo.bar')).toBe(false);
  });

  it('rename moves data to the new name', () => {
    storage.write('old.name', { a: 1 });
    expect(storage.rename('old.name', 'new.name')).toBe(true);
    expect(storage.exists('old.name')).toBe(false);
    expect(storage.read('new.name')).toEqual({ a: 1 });
    expect(storage.rename('missing', 'whatever')).toBe(false);
  });

  it('listAll filters by prefix', () => {
    storage.write('node.type.article', {});
    storage.write('node.type.page', {});
    storage.write('user.role.admin', {});
    expect(storage.listAll('node.type.').sort()).toEqual([
      'node.type.article',
      'node.type.page',
    ]);
    expect(storage.listAll().sort()).toEqual([
      'node.type.article',
      'node.type.page',
      'user.role.admin',
    ]);
  });

  it('deleteAll removes objects by prefix', () => {
    storage.write('node.type.article', {});
    storage.write('node.type.page', {});
    storage.write('user.role.admin', {});
    expect(storage.deleteAll('node.type.')).toBe(true);
    expect(storage.listAll()).toEqual(['user.role.admin']);
  });

  it('encode/decode are identity transforms', () => {
    const data = { a: 1 };
    expect(storage.encode(data)).toBe(data);
    expect(storage.decode(data)).toBe(data);
  });

  describe('collections', () => {
    it('createCollection shares the backing store but isolates names', () => {
      storage.write('default.only', { a: 1 });
      const collection = storage.createCollection('language.de');
      expect(collection.getCollectionName()).toBe('language.de');
      expect(collection.exists('default.only')).toBe(false);
      collection.write('default.only', { a: 2 });
      expect(storage.read('default.only')).toEqual({ a: 1 });
      expect(collection.read('default.only')).toEqual({ a: 2 });
    });

    it('getAllCollectionNames excludes the default and empty collections', () => {
      const de = storage.createCollection('language.de');
      de.write('foo.bar', { a: 1 });
      const fr = storage.createCollection('language.fr');
      fr.write('foo.bar', { a: 2 });
      expect(storage.getAllCollectionNames()).toEqual(['language.de', 'language.fr']);
    });
  });
});
