import { describe, it, expect } from 'vitest';
import { LayoutDefinition } from './layout-definition.js';

describe('LayoutDefinition', () => {
  const twocol = new LayoutDefinition({
    id: 'layout_twocol_section',
    label: 'Two column',
    category: 'Columns: 2',
    default_region: 'first',
    theme_hook: 'layout__twocol_section',
    library: 'layout_builder/twocol_section',
    regions: { first: { label: 'First' }, second: { label: 'Second' } },
  });

  it('exposes id, label and category', () => {
    expect(twocol.getId()).toBe('layout_twocol_section');
    expect(twocol.getLabel()).toBe('Two column');
    expect(twocol.getCategory()).toBe('Columns: 2');
  });

  it('returns region names in declaration order', () => {
    expect(twocol.getRegionNames()).toEqual(['first', 'second']);
  });

  it('returns region labels keyed by name', () => {
    expect(twocol.getRegionLabels()).toEqual({ first: 'First', second: 'Second' });
  });

  it('returns the declared default region', () => {
    expect(twocol.getDefaultRegion()).toBe('first');
  });

  it('falls back to the first region when no default declared', () => {
    const def = new LayoutDefinition({ id: 'x', regions: { main: { label: 'Main' } } });
    expect(def.getDefaultRegion()).toBe('main');
  });

  it('falls back label to id and category to empty string', () => {
    const def = new LayoutDefinition({ id: 'bare' });
    expect(def.getLabel()).toBe('bare');
    expect(def.getCategory()).toBe('');
    expect(def.getRegionNames()).toEqual([]);
    expect(def.getDefaultRegion()).toBe('');
  });

  it('exposes theme hook, template and library', () => {
    expect(twocol.getThemeHook()).toBe('layout__twocol_section');
    expect(twocol.getLibrary()).toBe('layout_builder/twocol_section');
    expect(twocol.getTemplate()).toBeUndefined();
  });
});
