import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerToolbarHooks, MODULE_NAME } from './register.js';
import { ToolbarHooks } from './ToolbarHooks.js';
import type { AccountInterface, ToolbarModuleHandler } from '../contracts.js';

const deps = {
  currentUser: { hasPermission: (p: string) => p === 'access toolbar' } as AccountInterface,
  moduleHandler: {
    invokeAll: () => ({}),
    alter: () => {},
    moduleExists: () => false,
  } as ToolbarModuleHandler,
  getSubtreesHash: () => 'hash',
};

describe('registerToolbarHooks', () => {
  it('registers help, page_top and toolbar implementations under the toolbar module', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });

    registerToolbarHooks(handler, new ToolbarHooks(deps));

    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.hasImplementations('page_top')).toBe(true);
    expect(handler.hasImplementations('toolbar')).toBe(true);
    expect(handler.getImplementations('toolbar')).toContain(MODULE_NAME);
  });

  it('the registered help implementation returns toolbar help text', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerToolbarHooks(handler, new ToolbarHooks(deps));

    const result = handler.invoke(MODULE_NAME, 'help', ['help.page.toolbar']) as string;
    expect(result).toContain('Toolbar module');
  });
});
