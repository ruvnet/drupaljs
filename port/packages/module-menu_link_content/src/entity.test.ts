import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MenuLinkContent, menuLinkContentEntityType } from './entity.js';
import type { MenuLinkManagerInterface, MenuLinkPluginDefinition } from './types.js';

function makeManager() {
  const defs = new Map<string, MenuLinkPluginDefinition>();
  return {
    defs,
    getDefinition: vi.fn((id: string) => defs.get(id)),
    addDefinition: vi.fn((id: string, def: MenuLinkPluginDefinition) => {
      defs.set(id, def);
      return def;
    }),
    updateDefinition: vi.fn((id: string, def: MenuLinkPluginDefinition) => {
      defs.set(id, def as MenuLinkPluginDefinition);
      return def as MenuLinkPluginDefinition;
    }),
    removeDefinition: vi.fn((id: string) => {
      defs.delete(id);
    }),
    loadLinksByRoute: vi.fn(() => ({})),
  } satisfies MenuLinkManagerInterface & { defs: Map<string, MenuLinkPluginDefinition> };
}

describe('menuLinkContentEntityType definition', () => {
  it('exposes the Drupal entity-type id, keys and admin permission', () => {
    expect(menuLinkContentEntityType.id).toBe('menu_link_content');
    expect(menuLinkContentEntityType.admin_permission).toBe('administer menu');
    expect(menuLinkContentEntityType.entity_keys.label).toBe('title');
    expect(menuLinkContentEntityType.entity_keys.published).toBe('enabled');
    expect(menuLinkContentEntityType.translatable).toBe(true);
  });
});

describe('MenuLinkContent — defaults & accessors', () => {
  it('defaults bundle, menu_name=tools, weight 0 and disabled/collapsed off by preCreate', () => {
    const e = MenuLinkContent.create({ title: 'Home', link: { uri: 'internal:/' } });
    expect(e.getMenuName()).toBe('tools');
    expect(e.getWeight()).toBe(0);
    expect(e.isExpanded()).toBe(false);
    // enabled defaults to true (published) per EditorialContentEntityBase default.
    expect(e.isEnabled()).toBe(true);
    expect(e.getTitle()).toBe('Home');
    expect(e.getParentId()).toBe('');
  });

  it('derives the plugin id from the uuid', () => {
    const e = MenuLinkContent.create({ uuid: 'abc-123', title: 'X', link: { uri: 'internal:/x' } });
    expect(e.getPluginId()).toBe('menu_link_content:abc-123');
  });

  it('getUrlObject resolves the stored link uri', () => {
    const e = MenuLinkContent.create({ title: 'Ext', link: { uri: 'https://example.com' } });
    const url = e.getUrlObject();
    expect(url.isExternal()).toBe(true);
    expect(url.toString()).toBe('https://example.com');
  });

  it('getParentId casts to string ("" means top level)', () => {
    const e = MenuLinkContent.create({
      title: 'Child',
      link: { uri: 'internal:/c' },
      parent: 'menu_link_content:parent-uuid',
    });
    expect(e.getParentId()).toBe('menu_link_content:parent-uuid');
  });
});

describe('MenuLinkContent.getPluginDefinition', () => {
  it('builds a routed definition for internal routes and an unrouted one for URIs', () => {
    const e = MenuLinkContent.create({
      uuid: 'u1',
      title: 'About',
      description: 'About page',
      weight: 3,
      menu_name: 'main',
      link: { uri: 'https://example.com/about' },
      enabled: true,
      expanded: true,
    });
    const def = e.getPluginDefinition();
    expect(def.id).toBe('menu_link_content:u1');
    expect(def.provider).toBe('menu_link_content');
    expect(def.menu_name).toBe('main');
    expect(def.title).toBe('About');
    expect(def.weight).toBe(3);
    expect(def.enabled).toBe(1);
    expect(def.expanded).toBe(1);
    // External URI -> unrouted: url is set, route_name null.
    expect(def.url).toBe('https://example.com/about');
    expect(def.route_name).toBeNull();
    expect(def.class).toContain('MenuLinkContent');
  });
});

describe('MenuLinkContent.preSave — rediscovery flag', () => {
  it('flags rediscovery for internal: links and clears it otherwise', () => {
    const internal = MenuLinkContent.create({ title: 'I', link: { uri: 'internal:/blog' } });
    internal.preSave();
    expect(internal.requiresRediscovery()).toBe(true);

    const external = MenuLinkContent.create({ title: 'E', link: { uri: 'https://x.test' } });
    external.preSave();
    expect(external.requiresRediscovery()).toBe(false);
  });
});

describe('MenuLinkContent.postSave — menu tree sync', () => {
  let manager: ReturnType<typeof makeManager>;

  beforeEach(() => {
    manager = makeManager();
  });

  it('adds the definition when none exists', () => {
    const e = MenuLinkContent.create({ uuid: 'new', title: 'N', link: { uri: 'https://n.test' } });
    e.postSave(manager, false);
    expect(manager.addDefinition).toHaveBeenCalledOnce();
    expect(manager.addDefinition).toHaveBeenCalledWith('menu_link_content:new', expect.any(Object));
    expect(manager.updateDefinition).not.toHaveBeenCalled();
  });

  it('updates the definition when one already exists and not insidePlugin', () => {
    const e = MenuLinkContent.create({ uuid: 'ex', title: 'E', link: { uri: 'https://e.test' } });
    manager.addDefinition('menu_link_content:ex', e.getPluginDefinition());
    manager.addDefinition.mockClear();

    e.postSave(manager, true);
    expect(manager.updateDefinition).toHaveBeenCalledOnce();
    expect(manager.addDefinition).not.toHaveBeenCalled();
  });

  it('skips updateDefinition when wrapped inside a plugin instance', () => {
    const e = MenuLinkContent.create({ uuid: 'ip', title: 'IP', link: { uri: 'https://ip.test' } });
    manager.addDefinition('menu_link_content:ip', e.getPluginDefinition());
    manager.updateDefinition.mockClear();
    e.setInsidePlugin();
    e.postSave(manager, true);
    expect(manager.updateDefinition).not.toHaveBeenCalled();
  });
});
