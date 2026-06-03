import { describe, it, expect } from 'vitest';
import { PluginBase } from './plugin-base.js';
import type { PluginDefinition } from './types.js';

class Sample extends PluginBase {}

describe('PluginBase', () => {
  const def: PluginDefinition = { id: 'sample', class: Sample };

  it('exposes id, definition and configuration', () => {
    const p = new Sample({ a: 1 }, 'sample', def);
    expect(p.getPluginId()).toBe('sample');
    expect(p.getPluginDefinition()).toBe(def);
  });

  it('reports the base id and null derivative for a non-derivative plugin', () => {
    const p = new Sample({}, 'sample', def);
    expect(p.getBaseId()).toBe('sample');
    expect(p.getDerivativeId()).toBeNull();
  });

  it('splits base and derivative ids on the separator', () => {
    const p = new Sample({}, 'block:system_main', def);
    expect(p.getBaseId()).toBe('block');
    expect(p.getDerivativeId()).toBe('system_main');
  });

  it('only splits on the first separator', () => {
    const p = new Sample({}, 'a:b:c', def);
    expect(p.getBaseId()).toBe('a');
    expect(p.getDerivativeId()).toBe('b:c');
  });
});
