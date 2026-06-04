import { describe, it, expect } from 'vitest';
import { Shortcut } from './Shortcut.js';

describe('Shortcut entity', () => {
  it('gets and sets title fluently', () => {
    const s = new Shortcut({ shortcut_set: 'default', title: 'Home', weight: 0, link: { route: '<front>' } });
    expect(s.getTitle()).toBe('Home');
    expect(s.setTitle('Start')).toBe(s);
    expect(s.getTitle()).toBe('Start');
  });

  it('gets and sets weight fluently', () => {
    const s = new Shortcut({ shortcut_set: 'default', title: 'X', weight: 3, link: { route: 'a' } });
    expect(s.getWeight()).toBe(3);
    expect(s.setWeight(7)).toBe(s);
    expect(s.getWeight()).toBe(7);
  });

  it('exposes the link url and bundle', () => {
    const s = new Shortcut({ shortcut_set: 'team', title: 'N', weight: 0, link: { route: 'node.add' } });
    expect(s.getUrl()).toEqual({ route: 'node.add' });
    expect(s.bundle()).toBe('team');
  });

  it('derives cache tags to invalidate from its shortcut set', () => {
    const s = new Shortcut({ shortcut_set: 'default', title: 'N', weight: 0, link: { route: 'a' } });
    expect(s.getCacheTagsToInvalidate()).toEqual(['config:shortcut.set.default']);
  });

  it('sorts by weight ascending, then by case-insensitive natural title', () => {
    const mk = (title: string, weight: number) =>
      new Shortcut({ shortcut_set: 'default', title, weight, link: { route: 'a' } });
    const list = [mk('beta', 1), mk('Alpha', 0), mk('item10', 0), mk('item2', 0)];
    list.sort(Shortcut.sort);
    expect(list.map((s) => s.getTitle())).toEqual(['Alpha', 'item2', 'item10', 'beta']);
  });
});
