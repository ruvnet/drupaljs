import { describe, it, expect } from 'vitest';
import { LayoutPluginManager, type ExtensionResolver } from './layout-plugin-manager.js';
import { coreLayoutDefinitions } from './layouts.js';
import { LayoutDefault } from './layout-default.js';

function managerWithCore(resolver?: ExtensionResolver): LayoutPluginManager {
  const manager = new LayoutPluginManager(resolver);
  manager.addDefinitions(coreLayoutDefinitions);
  return manager;
}

describe('LayoutPluginManager.processDefinition', () => {
  it('derives theme_hook and template file from the template', () => {
    const manager = managerWithCore();
    const def = manager.getDefinition('layout_twocol_bricks')!;
    // template "layout--twocol-bricks" -> file kept, hook dashes->underscores.
    expect(def.getTemplate()).toBe('layout--twocol-bricks');
    expect(def.getThemeHook()).toBe('layout__twocol_bricks');
    expect(def.getTemplatePath()).toBe('layouts/twocol_bricks');
  });

  it('defaults category to the extension name when resolvable', () => {
    const resolver: ExtensionResolver = {
      resolve: (p) => (p === 'layout_discovery' ? { name: 'Layout Discovery', path: 'core/modules/layout_discovery' } : null),
    };
    const manager = new LayoutPluginManager(resolver);
    // Provide a definition without a category to force the default.
    manager.addDefinition({
      id: 'no_cat',
      label: 'No cat',
      provider: 'layout_discovery',
      regions: { content: { label: 'Content' } },
    });
    expect(manager.getDefinition('no_cat')!.getCategory()).toBe('Layout Discovery');
  });

  it('prefixes path with the extension base path when resolvable', () => {
    const resolver: ExtensionResolver = {
      resolve: () => ({ name: 'Layout Discovery', path: 'core/modules/layout_discovery' }),
    };
    const manager = new LayoutPluginManager(resolver);
    manager.addDefinition({
      id: 'layout_onecol',
      label: 'One column',
      path: 'layouts/onecol',
      provider: 'layout_discovery',
      regions: { content: { label: 'Content' } },
    });
    expect(manager.getDefinition('layout_onecol')!.getPath()).toBe(
      'core/modules/layout_discovery/layouts/onecol',
    );
  });

  it('defaults default_region to the first region when unset', () => {
    const manager = new LayoutPluginManager();
    manager.addDefinition({
      id: 'r',
      label: 'R',
      regions: { alpha: { label: 'Alpha' }, beta: { label: 'Beta' } },
    });
    expect(manager.getDefinition('r')!.getDefaultRegion()).toBe('alpha');
  });
});

describe('LayoutPluginManager queries', () => {
  it('exposes all five core layouts', () => {
    const manager = managerWithCore();
    expect(Object.keys(manager.getDefinitions()).sort()).toEqual(
      [
        'layout_onecol',
        'layout_threecol_25_50_25',
        'layout_threecol_33_34_33',
        'layout_twocol',
        'layout_twocol_bricks',
      ].sort(),
    );
  });

  it('returns null for an unknown definition', () => {
    expect(managerWithCore().getDefinition('nope')).toBeNull();
  });

  it('lists unique categories sorted naturally', () => {
    expect(managerWithCore().getCategories()).toEqual(['Columns: 1', 'Columns: 2', 'Columns: 3']);
  });

  it('groups definitions by category', () => {
    const grouped = managerWithCore().getGroupedDefinitions();
    expect(Object.keys(grouped)).toEqual(['Columns: 1', 'Columns: 2', 'Columns: 3']);
    expect(Object.keys(grouped['Columns: 2']!)).toEqual(['layout_twocol', 'layout_twocol_bricks']);
  });

  it('builds layout options as category -> id -> label', () => {
    const options = managerWithCore().getLayoutOptions();
    expect(options['Columns: 1']).toEqual({ layout_onecol: 'One column' });
    expect(options['Columns: 3']!['layout_threecol_25_50_25']).toBe('Three column 25/50/25');
  });
});

describe('LayoutPluginManager.getThemeImplementations', () => {
  it('always provides the base layout hook with initial preprocess', () => {
    const hooks = managerWithCore().getThemeImplementations();
    expect(hooks['layout']).toEqual({
      'render element': 'content',
      'initial preprocess': 'LayoutDiscoveryThemeHooks:preprocessLayout',
    });
  });

  it('adds a derived theme hook per layout with base hook layout', () => {
    const hooks = managerWithCore().getThemeImplementations();
    expect(hooks['layout__onecol']).toEqual({
      'render element': 'content',
      'base hook': 'layout',
      template: 'layout--onecol',
      path: 'layouts/onecol',
    });
  });
});

describe('LayoutPluginManager.createInstance', () => {
  it('instantiates a LayoutDefault bound to the definition', () => {
    const manager = managerWithCore();
    const instance = manager.createInstance('layout_onecol', { label: 'Main' });
    expect(instance).toBeInstanceOf(LayoutDefault);
    expect(instance.getPluginDefinition().getId()).toBe('layout_onecol');
    expect(instance.getConfiguration().label).toBe('Main');
  });

  it('throws for an unknown plugin id', () => {
    expect(() => managerWithCore().createInstance('nope')).toThrow(/does not exist/);
  });
});
