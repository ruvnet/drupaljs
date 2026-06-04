import { describe, it, expect, vi } from 'vitest';
import { ShortcutAccessControlHandler } from './ShortcutAccessControlHandler.js';
import { ShortcutSet } from './Entity/ShortcutSet.js';
import { Shortcut } from './Entity/Shortcut.js';
import { accessAllowed, accessNeutral } from './contracts.js';
import type { ShortcutSetStorageInterface } from './ShortcutSetStorage.js';

const set = new ShortcutSet({ id: 'default', label: 'Default' });

const setStorage = (loaded: ShortcutSet | null): ShortcutSetStorageInterface =>
  ({ load: vi.fn(() => loaded) }) as unknown as ShortcutSetStorageInterface;

describe('ShortcutAccessControlHandler', () => {
  it('checkAccess delegates to set-edit access for the loaded bundle set', () => {
    const setEditAccess = vi.fn(() => accessAllowed());
    const handler = new ShortcutAccessControlHandler(setStorage(set), { setEditAccess } as never);
    const shortcut = new Shortcut({ shortcut_set: 'default', title: 'X', weight: 0, link: { route: 'a' } });
    const result = handler.checkAccess(shortcut);
    expect(setEditAccess).toHaveBeenCalledWith(set);
    expect(result.isAllowed()).toBe(true);
  });

  it('checkAccess is neutral when the bundle set is missing', () => {
    const handler = new ShortcutAccessControlHandler(setStorage(null), { setEditAccess: vi.fn() } as never);
    const shortcut = new Shortcut({ shortcut_set: 'ghost', title: 'X', weight: 0, link: { route: 'a' } });
    expect(handler.checkAccess(shortcut).verdict).toBe('neutral');
  });

  it('checkCreateAccess delegates to set-edit access for the bundle', () => {
    const setEditAccess = vi.fn(() => accessNeutral());
    const handler = new ShortcutAccessControlHandler(setStorage(set), { setEditAccess } as never);
    const result = handler.checkCreateAccess('default');
    expect(setEditAccess).toHaveBeenCalledWith(set);
    expect(result.isAllowed()).toBe(false);
  });
});
