import { describe, it, expect } from 'vitest';
import {
  LayoutPluginManager,
  LayoutPluginNotFoundException,
} from './layout-plugin-manager.js';
import { LayoutDefault } from './layout-plugin.js';
import { registerBuiltinLayouts, BUILTIN_LAYOUTS } from './builtin-layouts.js';

describe('LayoutPluginManager', () => {
  it('registers and retrieves a definition', () => {
    const manager = new LayoutPluginManager();
    manager.addDefinition({ id: 'layout_onecol', regions: { content: { label: 'C' } } });
    expect(manager.hasDefinition('layout_onecol')).toBe(true);
    expect(manager.getDefinition('layout_onecol').getId()).toBe('layout_onecol');
  });

  it('throws LayoutPluginNotFoundException for an unknown id', () => {
    const manager = new LayoutPluginManager();
    expect(() => manager.getDefinition('nope')).toThrow(LayoutPluginNotFoundException);
    expect(manager.hasDefinition('nope')).toBe(false);
  });

  it('creates a LayoutDefault instance with merged configuration', () => {
    const manager = new LayoutPluginManager();
    manager.addDefinition({ id: 'layout_onecol', regions: { content: { label: 'C' } } });
    const instance = manager.createInstance('layout_onecol', { label: 'Main' });
    expect(instance).toBeInstanceOf(LayoutDefault);
    expect(instance.getConfiguration()).toEqual({ label: 'Main' });
  });

  it('registers all built-in layouts and exposes sorted categories', () => {
    const manager = new LayoutPluginManager();
    registerBuiltinLayouts(manager);
    expect(Object.keys(manager.getDefinitions())).toEqual(
      BUILTIN_LAYOUTS.map((d) => d.id),
    );
    expect(manager.getCategories()).toEqual([
      'Columns: 1',
      'Columns: 2',
      'Columns: 3',
      'Columns: 4',
    ]);
  });

  it('built-in twocol layout matches the ported layouts.yml', () => {
    const manager = new LayoutPluginManager();
    registerBuiltinLayouts(manager);
    const twocol = manager.getDefinition('layout_twocol_section');
    expect(twocol.getRegionNames()).toEqual(['first', 'second']);
    expect(twocol.getDefaultRegion()).toBe('first');
    expect(twocol.getLibrary()).toBe('layout_builder/twocol_section');
  });
});
