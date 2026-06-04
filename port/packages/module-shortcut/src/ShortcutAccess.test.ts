import { describe, it, expect } from 'vitest';
import { ShortcutAccess } from './ShortcutAccess.js';
import { ShortcutSet } from './Entity/ShortcutSet.js';
import type { AccountInterface } from './contracts.js';
import type { ShortcutSetStorageInterface } from './ShortcutSetStorage.js';

const account = (id: number, perms: string[]): AccountInterface => ({
  id: () => id,
  hasPermission: (p) => perms.includes(p),
});

const displayed = new ShortcutSet({ id: 'default', label: 'Default' });
const other = new ShortcutSet({ id: 'team', label: 'Team' });

const storage = (): ShortcutSetStorageInterface =>
  ({
    getDisplayedToUser: () => displayed,
  }) as unknown as ShortcutSetStorageInterface;

const make = (current: AccountInterface) => new ShortcutAccess(storage(), () => current);

describe('ShortcutAccess.setEditAccess', () => {
  it('allows administrators to edit any set', () => {
    const a = make(account(1, ['administer shortcuts']));
    expect(a.setEditAccess(other).isAllowed()).toBe(true);
  });

  it('allows editing the currently displayed set with customize + access perms', () => {
    const a = make(account(1, ['customize shortcut links', 'access shortcuts']));
    expect(a.setEditAccess(displayed).isAllowed()).toBe(true);
  });

  it('denies editing a non-displayed set even with customize perms', () => {
    const a = make(account(1, ['customize shortcut links', 'access shortcuts']));
    const result = a.setEditAccess(other);
    expect(result.isAllowed()).toBe(false);
    expect(result.reason).toContain('currently displayed set');
  });

  it('denies users lacking the required permissions', () => {
    const a = make(account(1, []));
    expect(a.setEditAccess(displayed).isAllowed()).toBe(false);
  });
});

describe('ShortcutAccess.setSwitchAccess', () => {
  it('allows administrators to switch anyone', () => {
    const a = make(account(1, ['administer shortcuts']));
    expect(a.setSwitchAccess(account(2, [])).verdict).toBe('allowed');
  });

  it('is neutral without access shortcuts permission', () => {
    const a = make(account(1, []));
    expect(a.setSwitchAccess().verdict).toBe('neutral');
  });

  it('is neutral with access but without switch permission', () => {
    const a = make(account(1, ['access shortcuts']));
    expect(a.setSwitchAccess().verdict).toBe('neutral');
  });

  it('allows switching own set with access + switch perms', () => {
    const a = make(account(5, ['access shortcuts', 'switch shortcut sets']));
    expect(a.setSwitchAccess().verdict).toBe('allowed');
    expect(a.setSwitchAccess(account(5, [])).verdict).toBe('allowed');
  });

  it('is neutral when switching another user without admin', () => {
    const a = make(account(5, ['access shortcuts', 'switch shortcut sets']));
    expect(a.setSwitchAccess(account(9, [])).verdict).toBe('neutral');
  });
});
