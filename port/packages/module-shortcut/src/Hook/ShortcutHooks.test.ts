import { describe, it, expect, vi } from 'vitest';
import { ShortcutHooks } from './ShortcutHooks.js';
import { ShortcutSet } from '../Entity/ShortcutSet.js';
import type { AccountInterface, RenderArray, ShortcutModuleHandler } from '../contracts.js';
import type { ShortcutSetStorageInterface } from '../ShortcutSetStorage.js';

const account = (perms: string[]): AccountInterface => ({
  id: () => 1,
  hasPermission: (p) => perms.includes(p),
});

const moduleHandler: ShortcutModuleHandler = { moduleExists: () => false, invokeAll: () => [] };

const displayed = new ShortcutSet({ id: 'default', label: 'Default' });

const make = (perms: string[], storageOverrides: Partial<ShortcutSetStorageInterface> = {}) => {
  const storage = {
    getDisplayedToUser: () => displayed,
    unassignUser: vi.fn(),
    ...storageOverrides,
  } as unknown as ShortcutSetStorageInterface;
  const hooks = new ShortcutHooks({ currentUser: account(perms), moduleHandler, shortcutSetStorage: storage });
  return { hooks, storage };
};

describe('ShortcutHooks.help', () => {
  it('returns help markup for the shortcut help page', () => {
    const out = make([]).hooks.help('help.page.shortcut');
    expect(out).toContain('<h2>About</h2>');
    expect(out).toContain('Shortcut module');
  });

  it('returns the account-tab hint on the collection page for privileged users', () => {
    const out = make(['access shortcuts', 'switch shortcut sets']).hooks.help(
      'entity.shortcut_set.collection',
    );
    expect(out).toContain('account page');
  });

  it('returns null on the collection page for unprivileged users', () => {
    expect(make([]).hooks.help('entity.shortcut_set.collection')).toBeNull();
  });

  it('returns null for unrelated routes', () => {
    expect(make([]).hooks.help('help.page.node')).toBeNull();
  });
});

describe('ShortcutHooks.toolbar', () => {
  it('returns only the permission cache shell without access shortcuts', () => {
    const items = make([]).hooks.toolbar();
    const shortcuts = items['shortcuts'] as RenderArray;
    expect(shortcuts['#type']).toBeUndefined();
    expect((shortcuts['#cache'] as RenderArray)['contexts']).toEqual(['user.permissions']);
  });

  it('returns a full toolbar item for users with access shortcuts', () => {
    const items = make(['access shortcuts']).hooks.toolbar();
    const shortcuts = items['shortcuts'] as RenderArray;
    expect(shortcuts['#type']).toBe('toolbar_item');
    expect(shortcuts['#weight']).toBe(-10);
    const attached = shortcuts['#attached'] as RenderArray;
    expect((attached['library'] as string[])).toContain('shortcut/drupal.shortcut');
  });
});

describe('ShortcutHooks.userDelete', () => {
  it('unassigns the deleted user from any shortcut set', () => {
    const { hooks, storage } = make([]);
    const victim = account([]);
    hooks.userDelete(victim);
    expect(storage.unassignUser).toHaveBeenCalledWith(victim);
  });
});
