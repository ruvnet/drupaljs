import { describe, it, expect } from 'vitest';
import { ShortcutSetStorage } from './ShortcutSetStorage.js';
import { ShortcutSet } from './Entity/ShortcutSet.js';
import type { AccountInterface } from './contracts.js';

const account = (id: number): AccountInterface => ({ id: () => id, hasPermission: () => false });

const sets: Record<string, ShortcutSet> = {
  default: new ShortcutSet({ id: 'default', label: 'Default' }),
  team: new ShortcutSet({ id: 'team', label: 'Team' }),
};

const make = (defaultSuggestions: string[] = []) =>
  new ShortcutSetStorage({
    loadSet: (id) => sets[id] ?? null,
    invokeDefaultSetHook: () => defaultSuggestions,
  });

describe('ShortcutSetStorage assignment', () => {
  it('assigns and reads back the set name for a user', () => {
    const s = make();
    s.assignUser(sets.team!, account(7));
    expect(s.getAssignedToUser(account(7))).toBe('team');
  });

  it('unassignUser returns true when an assignment existed, false otherwise', () => {
    const s = make();
    s.assignUser(sets.team!, account(7));
    expect(s.unassignUser(account(7))).toBe(true);
    expect(s.unassignUser(account(7))).toBe(false);
    expect(s.getAssignedToUser(account(7))).toBeNull();
  });

  it('counts users assigned to a set', () => {
    const s = make();
    s.assignUser(sets.team!, account(1));
    s.assignUser(sets.team!, account(2));
    s.assignUser(sets.default!, account(3));
    expect(s.countAssignedUsers(sets.team!)).toBe(2);
    expect(s.countAssignedUsers(sets.default!)).toBe(1);
  });

  it('deletes all user assignments for a set', () => {
    const s = make();
    s.assignUser(sets.team!, account(1));
    s.assignUser(sets.team!, account(2));
    s.deleteAssignedShortcutSets(sets.team!);
    expect(s.countAssignedUsers(sets.team!)).toBe(0);
  });
});

describe('ShortcutSetStorage default/displayed resolution', () => {
  it('getDisplayedToUser returns the assigned set when present', () => {
    const s = make();
    s.assignUser(sets.team!, account(9));
    expect(s.getDisplayedToUser(account(9)).id()).toBe('team');
  });

  it('getDisplayedToUser falls back to the default set when unassigned', () => {
    const s = make();
    expect(s.getDisplayedToUser(account(9)).id()).toBe('default');
  });

  it('getDefaultSet prefers the last hook suggestion, then default', () => {
    const s = make(['team']);
    expect(s.getDefaultSet(account(1))?.id()).toBe('team');
    expect(make([]).getDefaultSet(account(1))?.id()).toBe('default');
  });
});
