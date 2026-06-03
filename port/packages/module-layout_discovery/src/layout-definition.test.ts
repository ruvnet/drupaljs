import { describe, it, expect } from 'vitest';
import { LayoutDefinition } from './layout-definition.js';

describe('LayoutDefinition', () => {
  it('populates typed properties from constructor values', () => {
    const def = new LayoutDefinition({
      id: 'layout_twocol',
      label: 'Two column',
      category: 'Columns: 2',
      default_region: 'first',
      path: 'layouts/twocol',
      library: 'layout_discovery/twocol',
      regions: { first: { label: 'First' }, second: { label: 'Second' } },
    });
    expect(def.getId()).toBe('layout_twocol');
    expect(def.getLabel()).toBe('Two column');
    expect(def.getCategory()).toBe('Columns: 2');
    expect(def.getDefaultRegion()).toBe('first');
    expect(def.getPath()).toBe('layouts/twocol');
    expect(def.getLibrary()).toBe('layout_discovery/twocol');
  });

  it('exposes region names and labels in definition order', () => {
    const def = new LayoutDefinition({
      regions: {
        top: { label: 'Top' },
        first: { label: 'First' },
        bottom: { label: 'Bottom' },
      },
    });
    expect(def.getRegionNames()).toEqual(['top', 'first', 'bottom']);
    expect(def.getRegionLabels()).toEqual({ top: 'Top', first: 'First', bottom: 'Bottom' });
  });

  it('spills unknown properties into the additional bag via get/set', () => {
    const def = new LayoutDefinition({ id: 'x', custom_key: 'hello' });
    expect(def.get('custom_key')).toBe('hello');
    def.set('another', 42);
    expect(def.get('another')).toBe(42);
    // Known properties still route to the typed field.
    def.set('label', 'L');
    expect(def.getLabel()).toBe('L');
    expect(def.get('label')).toBe('L');
  });

  it('returns null from get() for a missing property (PHP NULL faithful)', () => {
    const def = new LayoutDefinition({ id: 'x' });
    expect(def.get('nope')).toBeNull();
  });

  it('setters are chainable and mutate the definition', () => {
    const def = new LayoutDefinition();
    const ret = def.setLabel('A').setCategory('C').setTemplate('layout--x');
    expect(ret).toBe(def);
    expect(def.getLabel()).toBe('A');
    expect(def.getCategory()).toBe('C');
    expect(def.getTemplate()).toBe('layout--x');
  });
});
