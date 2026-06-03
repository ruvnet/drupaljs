import { describe, it, expect, vi } from 'vitest';
import { MenuLinkContentPlugin } from './plugin-menu-link.js';
import { MenuLinkContent } from './entity.js';
import type { MenuLinkPluginDefinition } from './types.js';

function plugin(entity: MenuLinkContent) {
  const def = entity.getPluginDefinition();
  return new MenuLinkContentPlugin(def, () => entity);
}

describe('MenuLinkContentPlugin', () => {
  it('reports its title/description/weight from the definition', () => {
    const e = MenuLinkContent.create({
      uuid: 'p1',
      title: 'Docs',
      description: 'Documentation',
      weight: 5,
      link: { uri: 'https://docs.test' },
    });
    const p = plugin(e);
    expect(p.getTitle()).toBe('Docs');
    expect(p.getDescription()).toBe('Documentation');
    expect(p.getWeight()).toBe(5);
  });

  it('is deletable and lazily loads its entity', () => {
    const e = MenuLinkContent.create({ uuid: 'p2', title: 'X', link: { uri: 'https://x.test' } });
    const loader = vi.fn(() => e);
    const p = new MenuLinkContentPlugin(e.getPluginDefinition(), loader);
    expect(p.isDeletable()).toBe(true);
    expect(loader).not.toHaveBeenCalled(); // not loaded until needed
    p.deleteLink = p.deleteLink; // no-op to keep tsc honest
  });

  it('deleteLink delegates to the entity delete callback', () => {
    const e = MenuLinkContent.create({ uuid: 'p3', title: 'D', link: { uri: 'https://d.test' } });
    const onDelete = vi.fn();
    const p = new MenuLinkContentPlugin(e.getPluginDefinition(), () => e, { onDelete });
    p.deleteLink();
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(e);
  });

  it('updateLink only applies override-allowed keys', () => {
    const e = MenuLinkContent.create({
      uuid: 'p4',
      title: 'Old',
      weight: 1,
      link: { uri: 'https://o.test' },
    });
    const p = plugin(e);
    const next = p.updateLink(
      { title: 'New', weight: 9, provider: 'evil', not_allowed: 'nope' } as Partial<MenuLinkPluginDefinition>,
      false,
    );
    expect(next.title).toBe('New');
    expect(next.weight).toBe(9);
    // provider is not override-allowed -> retains the original value.
    expect(next.provider).toBe('menu_link_content');
    expect((next as Record<string, unknown>).not_allowed).toBeUndefined();
  });

  it('updateLink with persist=true writes overrides back to the entity and saves', () => {
    const e = MenuLinkContent.create({ uuid: 'p5', title: 'Old', link: { uri: 'https://o.test' } });
    const onSave = vi.fn();
    const p = new MenuLinkContentPlugin(e.getPluginDefinition(), () => e, { onSave });
    p.updateLink({ title: 'Persisted', weight: 2 }, true);
    expect(e.getTitle()).toBe('Persisted');
    expect(e.getWeight()).toBe(2);
    expect(onSave).toHaveBeenCalledOnce();
  });
});
