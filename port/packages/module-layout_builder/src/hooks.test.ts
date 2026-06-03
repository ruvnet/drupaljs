import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  registerHooks,
  help,
  pluginFilterLayoutLayoutBuilderAlter,
  MODULE_NAME,
} from './hooks.js';

describe('layout_builder hooks', () => {
  it('help() returns markup for the module help route, null otherwise', () => {
    expect(help('help.page.layout_builder')).toMatch(/Layout Builder module/);
    expect(help('some.other.route')).toBeNull();
  });

  it('pluginFilterLayout alter removes the blank layout in place', () => {
    const definitions = {
      layout_onecol: { id: 'layout_onecol' },
      layout_builder_blank: { id: 'layout_builder_blank' },
    };
    pluginFilterLayoutLayoutBuilderAlter(definitions);
    expect(definitions.layout_builder_blank).toBeUndefined();
    expect(definitions.layout_onecol).toBeDefined();
  });

  it('registers its hooks on a real ModuleHandler and they are invocable', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerHooks(handler);

    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.getImplementations('help')).toEqual([MODULE_NAME]);

    // Invoke the help hook through the module handler.
    const result = handler.invoke(MODULE_NAME, 'help', ['help.page.layout_builder']);
    expect(result).toMatch(/Layout Builder module/);
  });

  it('runs the registered layout alter hook through the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerHooks(handler);

    const definitions = {
      layout_onecol: { id: 'layout_onecol' },
      layout_builder_blank: { id: 'layout_builder_blank' },
    };
    handler.invoke(MODULE_NAME, 'plugin_filter_layout__layout_builder_alter', [definitions]);
    expect(definitions.layout_builder_blank).toBeUndefined();
  });
});
