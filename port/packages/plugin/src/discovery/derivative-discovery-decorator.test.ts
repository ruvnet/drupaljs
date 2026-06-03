import { describe, it, expect, vi } from 'vitest';
import { DerivativeDiscoveryDecorator } from './derivative-discovery-decorator.js';
import { StaticDiscovery } from './static-discovery.js';
import { InvalidDeriverException } from '../exception.js';
import type { DeriverInterface, PluginDefinition } from '../types.js';

class BlockDeriver implements DeriverInterface {
  getDerivativeDefinition(id: string, base: PluginDefinition): PluginDefinition | null {
    const all = this.getDerivativeDefinitions(base);
    return all[id] ?? null;
  }
  getDerivativeDefinitions(base: PluginDefinition): Record<string, PluginDefinition> {
    return {
      a: { ...base, label: 'A' },
      b: { ...base, label: 'B' },
    };
  }
}

describe('DerivativeDiscoveryDecorator', () => {
  it('passes through non-derivative definitions unchanged', () => {
    const inner = new StaticDiscovery();
    inner.setDefinition('plain', { id: 'plain', class: 'X' });
    const d = new DerivativeDiscoveryDecorator(inner);
    expect(d.getDefinition('plain')?.id).toBe('plain');
  });

  it('expands derivatives into base:derivative ids in getDefinitions', () => {
    const inner = new StaticDiscovery();
    inner.setDefinition('block', { id: 'block', class: 'B', deriver: BlockDeriver });
    const d = new DerivativeDiscoveryDecorator(inner);
    const defs = d.getDefinitions();
    expect(Object.keys(defs).sort()).toEqual(['block:a', 'block:b']);
    expect(defs['block:a']?.label).toBe('A');
  });

  it('resolves a single derivative via getDefinition', () => {
    const inner = new StaticDiscovery();
    inner.setDefinition('block', { id: 'block', class: 'B', deriver: BlockDeriver });
    const d = new DerivativeDiscoveryDecorator(inner);
    expect(d.getDefinition('block:b')?.label).toBe('B');
  });

  it('instantiates each deriver once and caches it', () => {
    const inner = new StaticDiscovery();
    const ctor = vi.fn(() => new BlockDeriver());
    inner.setDefinition('block', {
      id: 'block',
      // The decorator only needs a constructable deriver.
      deriver: ctor as unknown as new (id: string) => DeriverInterface,
    });
    const d = new DerivativeDiscoveryDecorator(inner);
    d.getDefinitions();
    d.getDefinition('block:a');
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it('accepts a pre-built deriver instance', () => {
    const inner = new StaticDiscovery();
    const deriver: DeriverInterface = {
      getDerivativeDefinitions: vi.fn(() => ({ a: { id: 'block:a', label: 'A' } })),
      getDerivativeDefinition: vi.fn((id: string) =>
        id === 'a' ? { id: 'block:a', label: 'A' } : null,
      ),
    };
    inner.setDefinition('block', { id: 'block', deriver });
    const d = new DerivativeDiscoveryDecorator(inner);
    expect(d.getDefinition('block:a')?.label).toBe('A');
    // The single-definition path resolves via getDerivativeDefinition('a', base).
    expect(deriver.getDerivativeDefinition).toHaveBeenCalledWith('a', expect.any(Object));
  });

  it('throws InvalidDeriverException when deriver is not constructable', () => {
    const inner = new StaticDiscovery();
    inner.setDefinition('block', {
      id: 'block',
      deriver: 'NotAClass' as unknown as new (id: string) => DeriverInterface,
    });
    const d = new DerivativeDiscoveryDecorator(inner);
    expect(() => d.getDefinitions()).toThrow(InvalidDeriverException);
  });

  it('clearCachedDefinitions resets derivers', () => {
    const inner = new StaticDiscovery();
    const ctor = vi.fn(() => new BlockDeriver());
    inner.setDefinition('block', {
      id: 'block',
      deriver: ctor as unknown as new (id: string) => DeriverInterface,
    });
    const d = new DerivativeDiscoveryDecorator(inner);
    d.getDefinitions();
    d.clearCachedDefinitions();
    d.getDefinitions();
    expect(ctor).toHaveBeenCalledTimes(2);
  });
});
