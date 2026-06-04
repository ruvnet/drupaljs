import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  layoutDiscoveryHelp,
  layoutDiscoveryTheme,
  preprocessLayout,
  registerLayoutDiscoveryHooks,
  type LayoutTemplateVariables,
} from './hooks.js';
import { LayoutPluginManager } from './layout-plugin-manager.js';
import { coreLayoutDefinitions } from './layouts.js';

function manager(): LayoutPluginManager {
  const m = new LayoutPluginManager();
  m.addDefinitions(coreLayoutDefinitions);
  return m;
}

describe('layoutDiscoveryHelp', () => {
  it('returns help text for the module help page route', () => {
    const out = layoutDiscoveryHelp('help.page.layout_discovery');
    expect(out).toContain('Layout Discovery');
    expect(out).toContain('register layouts');
  });

  it('returns null for an unknown route (hook_help faithful)', () => {
    expect(layoutDiscoveryHelp('some.other.route')).toBeNull();
  });
});

describe('layoutDiscoveryTheme', () => {
  it('delegates to the manager getThemeImplementations', () => {
    const hooks = layoutDiscoveryTheme(manager());
    expect(hooks['layout']).toBeDefined();
    expect(hooks['layout__twocol']).toBeDefined();
  });
});

describe('preprocessLayout', () => {
  it('lifts #settings, #layout and #in_preview onto variables', () => {
    const variables: LayoutTemplateVariables = {
      content: { '#settings': { label: 'L' }, '#layout': { id: 'x' }, '#in_preview': true },
    };
    preprocessLayout(variables);
    expect(variables.settings).toEqual({ label: 'L' });
    expect(variables.layout).toEqual({ id: 'x' });
    expect(variables.in_preview).toBe(true);
  });

  it('defaults settings/layout/in_preview when absent', () => {
    const variables: LayoutTemplateVariables = { content: {} };
    preprocessLayout(variables);
    expect(variables.settings).toEqual({});
    expect(variables.layout).toEqual({});
    expect(variables.in_preview).toBe(false);
  });

  it('builds region_attributes for each child region, defaulting #attributes', () => {
    const variables: LayoutTemplateVariables = {
      content: {
        '#theme': 'layout__twocol',
        first: { '#markup': 'A', '#attributes': { class: ['x'] } },
        second: { '#markup': 'B' },
      },
    };
    preprocessLayout(variables);
    expect(variables.region_attributes).toEqual({
      first: { class: ['x'] },
      second: {},
    });
    // Missing #attributes are materialised on the child element too.
    expect((variables.content['second'] as Record<string, unknown>)['#attributes']).toEqual({});
  });
});

describe('registerLayoutDiscoveryHooks', () => {
  it('registers help and theme hooks on the ModuleHandler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ layout_discovery: { name: 'layout_discovery' } });
    registerLayoutDiscoveryHooks(handler, manager());

    expect(handler.hasImplementations('help', 'layout_discovery')).toBe(true);
    expect(handler.hasImplementations('theme', 'layout_discovery')).toBe(true);
  });

  it('help hook is invokable through the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ layout_discovery: { name: 'layout_discovery' } });
    registerLayoutDiscoveryHooks(handler, manager());

    const out = handler.invoke('layout_discovery', 'help', ['help.page.layout_discovery']);
    expect(out).toContain('Layout Discovery');
  });

  it('theme hook is invokable and returns layout theme implementations', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ layout_discovery: { name: 'layout_discovery' } });
    registerLayoutDiscoveryHooks(handler, manager());

    const hooks = handler.invoke('layout_discovery', 'theme') as Record<string, unknown>;
    expect(hooks['layout']).toBeDefined();
  });
});
