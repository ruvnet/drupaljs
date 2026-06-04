import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { MenuUiHooks } from './MenuUiHooks.js';
import { registerMenuUiHooks } from './register.js';

describe('MenuUiHooks.help', () => {
  const hooks = new MenuUiHooks();

  it('returns About + Uses help for the module help page', () => {
    const out = hooks.help('help.page.menu_ui');
    expect(out).toContain('About');
    expect(out).toContain('Menu UI module');
  });

  it('returns null for unrelated routes', () => {
    expect(hooks.help('some.other.route')).toBeNull();
  });
});

describe('MenuUiHooks.entityTypeBuild', () => {
  const hooks = new MenuUiHooks();

  it('wires the menu entity form/list-builder/link templates', () => {
    const entityTypes: Record<string, any> = { menu: makeEntityType() };
    hooks.entityTypeBuild(entityTypes);

    const menu = entityTypes.menu;
    expect(menu.getFormClass('add')).toBe('MenuForm');
    expect(menu.getFormClass('edit')).toBe('MenuForm');
    expect(menu.getFormClass('delete')).toBe('MenuDeleteForm');
    expect(menu.getListBuilderClass()).toBe('MenuListBuilder');
    expect(menu.getLinkTemplate('collection')).toBe('/admin/structure/menu');
    expect(menu.getLinkTemplate('edit-form')).toBe('/admin/structure/menu/manage/{menu}');
  });

  it('adds the MenuSettings constraint to the node entity type when present', () => {
    const node = makeEntityType();
    const entityTypes: Record<string, any> = { menu: makeEntityType(), node };
    hooks.entityTypeBuild(entityTypes);
    expect(node.getConstraints()).toHaveProperty('MenuSettings');
  });

  it('does nothing to node when the node entity type is absent', () => {
    const entityTypes: Record<string, any> = { menu: makeEntityType() };
    expect(() => hooks.entityTypeBuild(entityTypes)).not.toThrow();
  });
});

describe('MenuUiHooks.blockViewSystemMenuBlockAlter', () => {
  it('adds a contextual link for the block derivative menu', () => {
    const hooks = new MenuUiHooks();
    const build: Record<string, any> = {};
    const block = { getBaseId: () => 'system_menu_block', getDerivativeId: () => 'main' };

    hooks.blockViewSystemMenuBlockAlter(build, block);

    expect(build['#contextual_links'].menu).toEqual({ route_parameters: { menu: 'main' } });
  });

  it('ignores blocks that are not system_menu_block', () => {
    const hooks = new MenuUiHooks();
    const build: Record<string, any> = {};
    const block = { getBaseId: () => 'other', getDerivativeId: () => 'x' };

    hooks.blockViewSystemMenuBlockAlter(build, block);

    expect(build['#contextual_links']).toBeUndefined();
  });
});

describe('registerMenuUiHooks', () => {
  it('registers help under the menu_ui module and dispatches via the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ menu_ui: { name: 'menu_ui' } });
    const hooks = new MenuUiHooks();

    registerMenuUiHooks(handler, hooks);

    expect(handler.hasImplementations('help', 'menu_ui')).toBe(true);
    const out = handler.invoke('menu_ui', 'help', ['help.page.menu_ui']);
    expect(out).toContain('About');
  });

  it('registers the entity_type_build alter-style hook', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ menu_ui: { name: 'menu_ui' } });
    registerMenuUiHooks(handler, new MenuUiHooks());

    const entityTypes: Record<string, any> = { menu: makeEntityType() };
    handler.invoke('menu_ui', 'entity_type_build', [entityTypes]);
    expect(entityTypes.menu.getListBuilderClass()).toBe('MenuListBuilder');
  });
});

// --- Test double for an EntityType -----------------------------------------
function makeEntityType() {
  const formClasses: Record<string, string> = {};
  const linkTemplates: Record<string, string> = {};
  const constraints: Record<string, unknown> = {};
  let listBuilder = '';
  const et = {
    setFormClass(op: string, cls: string) {
      formClasses[op] = cls;
      return et;
    },
    getFormClass(op: string) {
      return formClasses[op];
    },
    setListBuilderClass(cls: string) {
      listBuilder = cls;
      return et;
    },
    getListBuilderClass() {
      return listBuilder;
    },
    setLinkTemplate(name: string, path: string) {
      linkTemplates[name] = path;
      return et;
    },
    getLinkTemplate(name: string) {
      return linkTemplates[name];
    },
    addConstraint(name: string, options: unknown) {
      constraints[name] = options;
      return et;
    },
    getConstraints() {
      return constraints;
    },
  };
  return et;
}
