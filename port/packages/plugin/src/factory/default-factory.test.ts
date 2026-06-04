import { describe, it, expect } from 'vitest';
import { DefaultFactory } from './default-factory.js';
import { PluginException } from '../exception.js';
import { vi } from 'vitest';
import type { DiscoveryInterface, PluginDefinition } from '../types.js';

interface FruitInterface {
  eat(): string;
}

class Apple implements FruitInterface {
  constructor(
    public readonly configuration: Record<string, unknown>,
    public readonly pluginId: string,
    public readonly pluginDefinition: PluginDefinition,
  ) {}
  eat(): string {
    return 'crunch';
  }
}

// Does NOT implement FruitInterface.eat — used for interface enforcement test.
class Rock {
  constructor(
    public readonly configuration: Record<string, unknown>,
    public readonly pluginId: string,
    public readonly pluginDefinition: PluginDefinition,
  ) {}
}

function discoveryWith(defs: Record<string, PluginDefinition>): DiscoveryInterface {
  return {
    getDefinition: vi.fn((id: string) => defs[id] ?? null),
    getDefinitions: vi.fn(() => defs),
    hasDefinition: vi.fn((id: string) => id in defs),
  };
}

describe('DefaultFactory', () => {
  it('creates an instance passing configuration, id and definition to the constructor', () => {
    const def: PluginDefinition = { id: 'apple', class: Apple };
    const factory = new DefaultFactory(discoveryWith({ apple: def }));
    const instance = factory.createInstance('apple', { ripe: true }) as Apple;
    expect(instance).toBeInstanceOf(Apple);
    expect(instance.configuration).toEqual({ ripe: true });
    expect(instance.pluginId).toBe('apple');
    expect(instance.pluginDefinition).toBe(def);
  });

  it('defaults configuration to an empty object', () => {
    const factory = new DefaultFactory(discoveryWith({ apple: { id: 'apple', class: Apple } }));
    const instance = factory.createInstance('apple') as Apple;
    expect(instance.configuration).toEqual({});
  });

  it('asks the discovery for the definition', () => {
    const disc = discoveryWith({ apple: { id: 'apple', class: Apple } });
    new DefaultFactory(disc).createInstance('apple');
    expect(disc.getDefinition).toHaveBeenCalledWith('apple');
  });

  it('throws PluginException when the definition has no class', () => {
    const factory = new DefaultFactory(discoveryWith({ apple: { id: 'apple' } }));
    expect(() => factory.createInstance('apple')).toThrow(PluginException);
    expect(() => factory.createInstance('apple')).toThrow(/did not specify an instance class/);
  });

  it('enforces the required interface (instanceof) when configured', () => {
    const factory = new DefaultFactory(
      discoveryWith({ rock: { id: 'rock', class: Rock } }),
      Apple, // require instances to be Apple
    );
    expect(() => factory.createInstance('rock')).toThrow(/must be an instance of/);
  });

  it('accepts an instance that satisfies the required interface', () => {
    const factory = new DefaultFactory(
      discoveryWith({ apple: { id: 'apple', class: Apple } }),
      Apple,
    );
    expect(factory.createInstance('apple')).toBeInstanceOf(Apple);
  });

  it('getPluginClass throws when class is a non-constructable string', () => {
    expect(() => DefaultFactory.getPluginClass('apple', { id: 'apple', class: 'Apple' })).toThrow(
      PluginException,
    );
  });
});
