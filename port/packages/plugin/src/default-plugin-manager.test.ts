import { describe, it, expect, vi } from 'vitest';
import { DefaultPluginManager } from './default-plugin-manager.js';
import { PluginBase } from './plugin-base.js';
import { PluginNotFoundException } from './exception.js';
import type {
  DefinitionCacheBackend,
  DeriverInterface,
  FallbackPluginManagerInterface,
  PluginDefinition,
} from './types.js';

class Block extends PluginBase {}

function memoryCache(): DefinitionCacheBackend {
  const store = new Map<string, Record<string, PluginDefinition>>();
  return {
    get: vi.fn((k: string) => store.get(k)),
    set: vi.fn((k: string, v: Record<string, PluginDefinition>) => {
      store.set(k, v);
    }),
    delete: vi.fn((k: string) => {
      store.delete(k);
    }),
  };
}

describe('DefaultPluginManager', () => {
  const manifest: PluginDefinition[] = [
    { id: 'system_main', class: Block },
    { id: 'system_branding', class: Block },
  ];

  it('discovers definitions from the manifest and applies defaults', () => {
    const m = new DefaultPluginManager(manifest, { defaults: { provider: 'system' } });
    expect(Object.keys(m.getDefinitions()).sort()).toEqual([
      'system_branding',
      'system_main',
    ]);
    expect(m.getDefinition('system_main')?.provider).toBe('system');
  });

  it('creates instances through the default factory', () => {
    const m = new DefaultPluginManager(manifest);
    const instance = m.createInstance('system_main', { region: 'header' });
    expect(instance).toBeInstanceOf(Block);
    expect((instance as Block).getPluginId()).toBe('system_main');
  });

  it('throws PluginNotFoundException for unknown ids', () => {
    const m = new DefaultPluginManager(manifest);
    expect(() => m.getDefinition('nope')).toThrow(PluginNotFoundException);
  });

  it('caches definitions: discovery runs once across repeated reads', () => {
    const spy = vi.fn(() => manifest);
    const m = new DefaultPluginManager(spy);
    m.getDefinitions();
    m.getDefinitions();
    m.getDefinition('system_main');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('persists definitions to the cache backend and reads them back', () => {
    const cache = memoryCache();
    const m = new DefaultPluginManager(manifest, { cache, cacheKey: 'block_plugins' });
    m.getDefinitions();
    expect(cache.set).toHaveBeenCalledWith('block_plugins', expect.any(Object));

    // A fresh manager sharing the cache should not need to re-run discovery.
    const spy = vi.fn(() => manifest);
    const m2 = new DefaultPluginManager(spy, { cache, cacheKey: 'block_plugins' });
    expect(Object.keys(m2.getDefinitions()).sort()).toEqual([
      'system_branding',
      'system_main',
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('clearCachedDefinitions forces re-discovery and clears the backend', () => {
    const cache = memoryCache();
    const spy = vi.fn(() => manifest);
    const m = new DefaultPluginManager(spy, { cache, cacheKey: 'k' });
    m.getDefinitions();
    m.clearCachedDefinitions();
    expect(cache.delete).toHaveBeenCalledWith('k');
    m.getDefinitions();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('useCaches(false) bypasses persistent cache and clears local state', () => {
    const cache = memoryCache();
    const spy = vi.fn(() => manifest);
    const m = new DefaultPluginManager(spy, { cache, cacheKey: 'k' });
    m.getDefinitions();
    m.useCaches(false);
    m.getDefinitions();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('expands derivatives provided by a deriver', () => {
    class MenuDeriver implements DeriverInterface {
      getDerivativeDefinition(id: string, base: PluginDefinition) {
        return this.getDerivativeDefinitions(base)[id] ?? null;
      }
      getDerivativeDefinitions(base: PluginDefinition): Record<string, PluginDefinition> {
        return {
          main: { ...base, label: 'Main' },
          admin: { ...base, label: 'Admin' },
        };
      }
    }
    const m = new DefaultPluginManager([
      { id: 'menu_block', class: Block, deriver: MenuDeriver },
    ]);
    const defs = m.getDefinitions();
    expect(Object.keys(defs).sort()).toEqual(['menu_block:admin', 'menu_block:main']);
    const instance = m.createInstance('menu_block:main');
    expect((instance as Block).getDerivativeId()).toBe('main');
  });

  it('supports a fallback plugin id for missing plugins', () => {
    class FallbackManager extends DefaultPluginManager implements FallbackPluginManagerInterface {
      getFallbackPluginId(): string {
        return 'system_main';
      }
    }
    const m = new FallbackManager(manifest);
    const instance = m.createInstance('does_not_exist');
    expect((instance as Block).getPluginId()).toBe('system_main');
  });
});
