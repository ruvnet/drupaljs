import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Config } from './config.js';
import { ImmutableConfig } from './immutable-config.js';
import { MemoryStorage } from './memory-storage.js';
import { ConfigEvents } from './events.js';
import type { EventDispatcherInterface } from './events.js';
import type { StorageInterface } from './storage.js';
import { ConfigNameException, ConfigValueException, ImmutableConfigException } from './exceptions.js';

function mockDispatcher(): EventDispatcherInterface & { dispatch: ReturnType<typeof vi.fn> } {
  return { dispatch: vi.fn((event) => event) };
}

describe('Config (mutable)', () => {
  let storage: StorageInterface;
  let dispatcher: ReturnType<typeof mockDispatcher>;

  beforeEach(() => {
    storage = new MemoryStorage();
    dispatcher = mockDispatcher();
  });

  const make = (name = 'system.site') =>
    new Config(name, storage, dispatcher);

  describe('get/set with dotted keys (NestedArray semantics)', () => {
    it('returns the whole data array for an empty key', () => {
      const c = make().setData({ name: 'Drupal', page: { front: '/node' } });
      expect(c.get()).toEqual({ name: 'Drupal', page: { front: '/node' } });
    });

    it('reads a top-level key', () => {
      const c = make().setData({ name: 'Drupal' });
      expect(c.get('name')).toBe('Drupal');
    });

    it('reads a nested dotted key', () => {
      const c = make().setData({ page: { front: '/node' } });
      expect(c.get('page.front')).toBe('/node');
    });

    it('returns a sub-tree for a partial key', () => {
      const c = make().setData({ page: { front: '/node', '403': '/deny' } });
      expect(c.get('page')).toEqual({ front: '/node', '403': '/deny' });
    });

    it('returns undefined for a missing key', () => {
      const c = make().setData({ name: 'Drupal' });
      expect(c.get('missing')).toBeUndefined();
      expect(c.get('page.front')).toBeUndefined();
    });

    it('sets a nested dotted key, creating structure', () => {
      const c = make();
      c.set('page.front', '/home');
      expect(c.get('page.front')).toBe('/home');
      expect(c.get('page')).toEqual({ front: '/home' });
    });

    it('clears a nested dotted key', () => {
      const c = make().setData({ page: { front: '/node', back: '/x' } });
      c.clear('page.front');
      expect(c.get('page')).toEqual({ back: '/x' });
    });
  });

  describe('key validation', () => {
    it('rejects setting an array value with a dotted key inside', () => {
      const c = make();
      expect(() => c.set('a', { 'bad.key': 1 })).toThrow(ConfigValueException);
    });

    it('rejects setData with dotted keys at any depth', () => {
      const c = make();
      expect(() => c.setData({ a: { 'b.c': 1 } })).toThrow(ConfigValueException);
    });
  });

  describe('save', () => {
    it('writes to storage and dispatches ConfigEvents.SAVE', () => {
      const c = make('system.site').setData({ name: 'Drupal' });
      c.save();
      expect(storage.read('system.site')).toEqual({ name: 'Drupal' });
      expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
      const [event, eventName] = dispatcher.dispatch.mock.calls[0]!;
      expect(eventName).toBe(ConfigEvents.SAVE);
      expect(event.getConfig()).toBe(c);
    });

    it('marks the object as no longer new after save', () => {
      const c = make().setData({ name: 'Drupal' });
      expect(c.isNew()).toBe(true);
      c.save();
      expect(c.isNew()).toBe(false);
    });

    it('validates the config name before saving', () => {
      const c = new Config('nonamespace', storage, dispatcher).setData({ a: 1 });
      expect(() => c.save()).toThrow(ConfigNameException);
    });
  });

  describe('delete', () => {
    it('removes from storage, clears data and dispatches ConfigEvents.DELETE', () => {
      const c = make('system.site').setData({ name: 'Drupal' });
      c.save();
      dispatcher.dispatch.mockClear();
      c.delete();
      expect(storage.exists('system.site')).toBe(false);
      expect(c.get()).toEqual({});
      expect(c.isNew()).toBe(true);
      const [, eventName] = dispatcher.dispatch.mock.calls[0]!;
      expect(eventName).toBe(ConfigEvents.DELETE);
    });
  });

  describe('cacheability', () => {
    it('includes a config:<name> cache tag', () => {
      const c = make('system.site');
      expect(c.getCacheTags()).toContain('config:system.site');
    });
  });

  describe('overrides layer', () => {
    it('module overrides take effect over stored data', () => {
      const c = make().setData({ name: 'Stored' });
      c.setModuleOverride({ name: 'Overridden' });
      expect(c.get('name')).toBe('Overridden');
      // Original (raw) data is untouched.
      expect(c.getRawData()).toEqual({ name: 'Stored' });
    });

    it('settings overrides take precedence over module overrides', () => {
      const c = make().setData({ name: 'Stored' });
      c.setModuleOverride({ name: 'Module' });
      c.setSettingsOverride({ name: 'Settings' });
      expect(c.get('name')).toBe('Settings');
    });

    it('hasOverrides reports presence overall and per key', () => {
      const c = make().setData({ a: 1, b: 2 });
      expect(c.hasOverrides()).toBe(false);
      c.setModuleOverride({ a: 99 });
      expect(c.hasOverrides()).toBe(true);
      expect(c.hasOverrides('a')).toBe(true);
      expect(c.hasOverrides('b')).toBe(false);
    });

    it('getOriginal returns pre-override data when overrides disabled', () => {
      const c = make().setData({ name: 'Stored' });
      c.save();
      c.setModuleOverride({ name: 'Overridden' });
      expect(c.getOriginal('name', false)).toBe('Stored');
      expect(c.getOriginal('name')).toBe('Overridden');
    });
  });
});

describe('ImmutableConfig', () => {
  const storage = new MemoryStorage();
  const dispatcher = mockDispatcher();
  const make = () => new ImmutableConfig('system.site', storage, dispatcher);

  it('allows reading via get', () => {
    const c = make();
    c.initWithData({ name: 'Drupal' });
    expect(c.get('name')).toBe('Drupal');
  });

  it('throws on set', () => {
    expect(() => make().set('a', 1)).toThrow(ImmutableConfigException);
  });

  it('throws on clear', () => {
    expect(() => make().clear('a')).toThrow(ImmutableConfigException);
  });

  it('throws on save', () => {
    expect(() => make().save()).toThrow(ImmutableConfigException);
  });

  it('throws on delete', () => {
    expect(() => make().delete()).toThrow(ImmutableConfigException);
  });
});
