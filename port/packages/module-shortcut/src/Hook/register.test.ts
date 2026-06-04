import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerShortcutHooks, MODULE_NAME } from './register.js';
import { ShortcutHooks } from './ShortcutHooks.js';
import { ShortcutSet } from '../Entity/ShortcutSet.js';
import type { AccountInterface, ShortcutModuleHandler } from '../contracts.js';
import type { ShortcutSetStorageInterface } from '../ShortcutSetStorage.js';

const account = (perms: string[]): AccountInterface => ({
  id: () => 1,
  hasPermission: (p) => perms.includes(p),
});

const buildHooks = () => {
  const storage = {
    getDisplayedToUser: () => new ShortcutSet({ id: 'default', label: 'Default' }),
    unassignUser: vi.fn(),
  } as unknown as ShortcutSetStorageInterface;
  const moduleHandler: ShortcutModuleHandler = { moduleExists: () => false, invokeAll: () => [] };
  return new ShortcutHooks({
    currentUser: account(['access shortcuts']),
    moduleHandler,
    shortcutSetStorage: storage,
  });
};

describe('registerShortcutHooks', () => {
  it('registers help, toolbar and user_delete under the shortcut module', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerShortcutHooks(handler, buildHooks());

    expect(handler.hasImplementations('help')).toBe(true);
    expect(handler.hasImplementations('toolbar')).toBe(true);
    expect(handler.hasImplementations('user_delete')).toBe(true);
    expect(handler.getImplementations('help')).toEqual([MODULE_NAME]);
  });

  it('invokes help through the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
    registerShortcutHooks(handler, buildHooks());
    const out = handler.invoke(MODULE_NAME, 'help', ['help.page.shortcut']) as string;
    expect(out).toContain('Shortcut module');
  });
});
