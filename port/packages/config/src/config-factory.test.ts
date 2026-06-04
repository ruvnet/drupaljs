import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigFactory } from './config-factory.js';
import { MemoryStorage } from './memory-storage.js';
import { Config } from './config.js';
import { ImmutableConfig } from './immutable-config.js';
import type { EventDispatcherInterface } from './events.js';
import type { ConfigFactoryOverrideInterface } from './overrides.js';
import { ImmutableConfigException } from './exceptions.js';

function mockDispatcher(): EventDispatcherInterface & { dispatch: ReturnType<typeof vi.fn> } {
  return { dispatch: vi.fn((event) => event) };
}

describe('ConfigFactory', () => {
  let storage: MemoryStorage;
  let dispatcher: ReturnType<typeof mockDispatcher>;
  let factory: ConfigFactory;

  beforeEach(() => {
    storage = new MemoryStorage();
    dispatcher = mockDispatcher();
    factory = new ConfigFactory(storage, dispatcher);
  });

  describe('get / getEditable', () => {
    it('get returns an ImmutableConfig', () => {
      storage.write('system.site', { name: 'Drupal' });
      const c = factory.get('system.site');
      expect(c).toBeInstanceOf(ImmutableConfig);
      expect(c.get('name')).toBe('Drupal');
      expect(() => c.set('name', 'x')).toThrow(ImmutableConfigException);
    });

    it('getEditable returns a mutable Config', () => {
      storage.write('system.site', { name: 'Drupal' });
      const c = factory.getEditable('system.site');
      expect(c).toBeInstanceOf(Config);
      c.set('name', 'Changed');
      expect(c.get('name')).toBe('Changed');
    });

    it('returns a new (empty) object for a non-existent name', () => {
      const c = factory.getEditable('does.not.exist');
      expect(c.isNew()).toBe(true);
      expect(c.get()).toEqual({});
    });
  });

  describe('static cache', () => {
    it('returns the same instance for repeated get of the same name', () => {
      storage.write('system.site', { name: 'Drupal' });
      expect(factory.get('system.site')).toBe(factory.get('system.site'));
    });

    it('reset clears the cache so a fresh instance is returned', () => {
      storage.write('system.site', { name: 'Drupal' });
      const first = factory.get('system.site');
      factory.reset('system.site');
      expect(factory.get('system.site')).not.toBe(first);
    });
  });

  describe('loadMultiple', () => {
    it('loads only existing objects keyed by name', () => {
      storage.write('a.one', { x: 1 });
      storage.write('a.two', { y: 2 });
      const loaded = factory.loadMultiple(['a.one', 'a.two', 'a.three']);
      expect(Object.keys(loaded).sort()).toEqual(['a.one', 'a.two']);
      expect(loaded['a.one']!.get('x')).toBe(1);
    });
  });

  describe('overrides via addOverride', () => {
    it('applies module overrides to immutable config from get()', () => {
      storage.write('system.site', { name: 'Stored' });
      const override: ConfigFactoryOverrideInterface = {
        loadOverrides: (names) =>
          names.includes('system.site') ? { 'system.site': { name: 'Overridden' } } : {},
        getCacheSuffix: () => 'test_override',
        getCacheableMetadata: () => ({ cacheTags: [], cacheContexts: [], cacheMaxAge: -1 }),
      };
      factory.addOverride(override);
      expect(factory.get('system.site').get('name')).toBe('Overridden');
      // getEditable bypasses overrides.
      expect(factory.getEditable('system.site').get('name')).toBe('Stored');
    });
  });

  describe('rename', () => {
    it('moves config in storage and dispatches a rename event', () => {
      storage.write('old.name', { a: 1 });
      factory.rename('old.name', 'new.name');
      expect(storage.exists('old.name')).toBe(false);
      expect(storage.read('new.name')).toEqual({ a: 1 });
      expect(dispatcher.dispatch).toHaveBeenCalled();
    });
  });

  describe('listAll', () => {
    it('delegates to the storage prefix listing', () => {
      storage.write('node.type.article', {});
      storage.write('node.type.page', {});
      expect(factory.listAll('node.type.').sort()).toEqual([
        'node.type.article',
        'node.type.page',
      ]);
    });
  });

  describe('save integration (event subscriber keeps cache fresh)', () => {
    it('updates cached immutable copies when an editable copy is saved', () => {
      storage.write('system.site', { name: 'Old' });
      const immutable = factory.get('system.site');
      const editable = factory.getEditable('system.site');
      editable.set('name', 'New');
      editable.save();
      // The factory subscribed to SAVE; the immutable cached copy is refreshed.
      expect(immutable.get('name')).toBe('New');
    });
  });
});
