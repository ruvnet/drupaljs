import { describe, it, expect, vi } from 'vitest';
import { PluginManagerBase } from './plugin-manager-base.js';
import { PluginNotFoundException } from './exception.js';
import type {
  DiscoveryInterface,
  FactoryInterface,
  FallbackPluginManagerInterface,
  MapperInterface,
  PluginDefinition,
} from './types.js';

function makeDiscovery(defs: Record<string, PluginDefinition>): DiscoveryInterface {
  return {
    getDefinition: vi.fn((id: string, exc = true) => {
      if (defs[id]) return defs[id]!;
      if (!exc) return null;
      throw new PluginNotFoundException(id);
    }),
    getDefinitions: vi.fn(() => defs),
    hasDefinition: vi.fn((id: string) => id in defs),
  };
}

class TestManager extends PluginManagerBase {
  constructor(discovery: DiscoveryInterface, factory: FactoryInterface, mapper?: MapperInterface) {
    super();
    this.discovery = discovery;
    this.factory = factory;
    if (mapper) this.mapper = mapper;
  }
}

class FallbackManager extends PluginManagerBase implements FallbackPluginManagerInterface {
  constructor(discovery: DiscoveryInterface, factory: FactoryInterface) {
    super();
    this.discovery = discovery;
    this.factory = factory;
  }
  getFallbackPluginId(): string {
    return 'broken';
  }
}

describe('PluginManagerBase', () => {
  const defs = { apple: { id: 'apple', class: 'Apple' } };

  it('proxies getDefinition/getDefinitions/hasDefinition to discovery', () => {
    const disc = makeDiscovery(defs);
    const factory: FactoryInterface = { createInstance: vi.fn() };
    const m = new TestManager(disc, factory);
    expect(m.getDefinition('apple')).toBe(defs.apple);
    expect(m.getDefinitions()).toBe(defs);
    expect(m.hasDefinition('apple')).toBe(true);
    expect(disc.getDefinition).toHaveBeenCalledWith('apple', true);
  });

  it('proxies createInstance to the factory', () => {
    const disc = makeDiscovery(defs);
    const instance = {};
    const factory: FactoryInterface = { createInstance: vi.fn(() => instance) };
    const m = new TestManager(disc, factory);
    expect(m.createInstance('apple', { x: 1 })).toBe(instance);
    expect(factory.createInstance).toHaveBeenCalledWith('apple', { x: 1 });
  });

  it('falls back when not found and the manager implements fallback', () => {
    const disc = makeDiscovery(defs);
    const broken = {};
    const factory: FactoryInterface = {
      createInstance: vi.fn((id: string) => {
        if (id === 'apple') throw new PluginNotFoundException('apple');
        return broken;
      }),
    };
    const m = new FallbackManager(disc, factory);
    expect(m.createInstance('apple')).toBe(broken);
    expect(factory.createInstance).toHaveBeenLastCalledWith('broken', {});
  });

  it('does not swallow not-found errors without fallback', () => {
    const disc = makeDiscovery(defs);
    const factory: FactoryInterface = {
      createInstance: vi.fn(() => {
        throw new PluginNotFoundException('apple');
      }),
    };
    const m = new TestManager(disc, factory);
    expect(() => m.createInstance('apple')).toThrow(PluginNotFoundException);
  });

  it('getInstance delegates to the mapper', () => {
    const disc = makeDiscovery(defs);
    const factory: FactoryInterface = { createInstance: vi.fn() };
    const out = {};
    const mapper: MapperInterface = { getInstance: vi.fn(() => out) };
    const m = new TestManager(disc, factory, mapper);
    expect(m.getInstance({ key: 'v' })).toBe(out);
    expect(mapper.getInstance).toHaveBeenCalledWith({ key: 'v' });
  });

  it('getInstance throws when no mapper is set', () => {
    const m = new TestManager(makeDiscovery(defs), { createInstance: vi.fn() });
    expect(() => m.getInstance({})).toThrow(/mapper/);
  });
});
