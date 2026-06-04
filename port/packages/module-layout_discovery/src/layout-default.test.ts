import { describe, it, expect } from 'vitest';
import { LayoutDefinition } from './layout-definition.js';
import { LayoutDefault } from './layout-default.js';

function makeDefinition(): LayoutDefinition {
  return new LayoutDefinition({
    id: 'layout_twocol',
    label: 'Two column',
    theme_hook: 'layout__twocol',
    library: 'layout_discovery/twocol',
    regions: { first: { label: 'First' }, second: { label: 'Second' } },
  });
}

describe('LayoutDefault.build', () => {
  it('keeps only defined regions, in definition order', () => {
    const layout = new LayoutDefault(makeDefinition());
    const build = layout.build({
      second: { '#markup': 'B' },
      first: { '#markup': 'A' },
      bogus: { '#markup': 'X' },
    });
    const childKeys = Object.keys(build).filter((k) => !k.startsWith('#'));
    expect(childKeys).toEqual(['first', 'second']);
    expect(build['bogus']).toBeUndefined();
  });

  it('attaches render metadata (#theme, #layout, #settings, #in_preview)', () => {
    const def = makeDefinition();
    const layout = new LayoutDefault(def, { label: 'My block' });
    const build = layout.build({ first: {} });
    expect(build['#theme']).toBe('layout__twocol');
    expect(build['#layout']).toBe(def);
    expect(build['#settings']).toEqual({ label: 'My block' });
    expect(build['#in_preview']).toBe(false);
  });

  it('attaches the asset library when the definition has one', () => {
    const layout = new LayoutDefault(makeDefinition());
    const build = layout.build({ first: {} });
    expect(build['#attached']).toEqual({ library: ['layout_discovery/twocol'] });
  });

  it('omits #attached when there is no library', () => {
    const def = new LayoutDefinition({ id: 'x', regions: { content: { label: 'Content' } } });
    const layout = new LayoutDefault(def);
    const build = layout.build({ content: {} });
    expect(build['#attached']).toBeUndefined();
  });

  it('reflects preview mode set via setInPreview', () => {
    const layout = new LayoutDefault(makeDefinition());
    layout.setInPreview(true);
    const build = layout.build({ first: {} });
    expect(build['#in_preview']).toBe(true);
  });

  it('applies default configuration (empty label) when none supplied', () => {
    const layout = new LayoutDefault(makeDefinition());
    expect(layout.getConfiguration()).toEqual({ label: '' });
  });
});
