import { describe, it, expect, vi } from 'vitest';
import { ShortcutSet } from './ShortcutSet.js';
import { Shortcut } from './Shortcut.js';
import type { ShortcutEntityStorageInterface } from '../ShortcutSetStorage.js';

const mk = (title: string, weight: number, set = 'default') =>
  new Shortcut({ shortcut_set: set, title, weight, link: { route: 'a' } });

describe('ShortcutSet entity', () => {
  it('exposes id, label, and config cache tag', () => {
    const set = new ShortcutSet({ id: 'team', label: 'Team' });
    expect(set.id()).toBe('team');
    expect(set.label()).toBe('Team');
    expect(set.getCacheTags()).toEqual(['config:shortcut.set.team']);
    expect(set.getCacheTagsToInvalidate()).toEqual(['config:shortcut.set.team']);
  });

  it('returns no shortcuts when no storage is injected', () => {
    expect(new ShortcutSet({ id: 'x', label: 'X' }).getShortcuts()).toEqual([]);
  });

  it('loads shortcuts for its bundle and returns them sorted', () => {
    const stored = [mk('beta', 1), mk('alpha', 0)];
    const storage: ShortcutEntityStorageInterface = {
      loadByProperties: vi.fn(() => stored),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const set = new ShortcutSet({ id: 'default', label: 'Default' }, storage);
    const result = set.getShortcuts();
    expect(storage.loadByProperties).toHaveBeenCalledWith({ shortcut_set: 'default' });
    expect(result.map((s) => s.getTitle())).toEqual(['alpha', 'beta']);
  });

  it('resetLinkWeights reweights sorted shortcuts from -49 and saves each', () => {
    const stored = [mk('beta', 5), mk('alpha', 5)];
    const storage: ShortcutEntityStorageInterface = {
      loadByProperties: () => stored,
      save: vi.fn(),
      delete: vi.fn(),
    };
    const set = new ShortcutSet({ id: 'default', label: 'Default' }, storage);
    set.resetLinkWeights();
    // Sorted -> alpha, beta -> weights -49, -48.
    expect(stored.find((s) => s.getTitle() === 'alpha')!.getWeight()).toBe(-49);
    expect(stored.find((s) => s.getTitle() === 'beta')!.getWeight()).toBe(-48);
    expect(storage.save).toHaveBeenCalledTimes(2);
  });
});
