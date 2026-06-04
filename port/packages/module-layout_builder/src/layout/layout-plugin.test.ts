import { describe, it, expect } from 'vitest';
import { LayoutDefinition } from './layout-definition.js';
import { LayoutDefault } from './layout-plugin.js';

const definition = new LayoutDefinition({
  id: 'layout_twocol_section',
  theme_hook: 'layout__twocol_section',
  library: 'layout_builder/twocol_section',
  regions: { first: { label: 'First' }, second: { label: 'Second' } },
});

describe('LayoutDefault.build', () => {
  it('keeps only defined regions, in definition order', () => {
    const layout = new LayoutDefault(definition);
    // Supply regions out of order plus an undefined one.
    const build = layout.build({ second: 'B', first: 'A', bogus: 'X' });
    const regionKeys = Object.keys(build).filter((k) => !k.startsWith('#') && k !== '#attached');
    expect(regionKeys).toEqual(['first', 'second']);
    expect(build['first']).toBe('A');
    expect(build['second']).toBe('B');
    expect(build['bogus']).toBeUndefined();
  });

  it('attaches preview flag, settings, layout and theme metadata', () => {
    const layout = new LayoutDefault(definition, { label: 'Hero' });
    layout.setInPreview(true);
    const build = layout.build({ first: 'A' });
    expect(build['#in_preview']).toBe(true);
    expect(build['#settings']).toEqual({ label: 'Hero' });
    expect(build['#layout']).toBe(definition);
    expect(build['#theme']).toBe('layout__twocol_section');
    expect(build['#attached']).toEqual({ library: ['layout_builder/twocol_section'] });
  });

  it('defaults in_preview to false and omits attached when no library', () => {
    const bare = new LayoutDefinition({ id: 'x', regions: { main: { label: 'M' } } });
    const layout = new LayoutDefault(bare);
    const build = layout.build({ main: 'C' });
    expect(build['#in_preview']).toBe(false);
    expect(build['#attached']).toBeUndefined();
    expect(build['#theme']).toBeUndefined();
    expect(build['#settings']).toEqual({ label: '' });
  });
});
