import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { ViewsUiHooks } from './ViewsUiHooks.js';
import type { DisplayPluginDefinition, ViewAccessChecker } from './ViewsUiHooks.js';
import { registerViewsUiHooks } from './register.js';
import type { BlockEntityLike } from '../contracts.js';

describe('ViewsUiHooks.help', () => {
  const hooks = new ViewsUiHooks();

  it('returns About + Uses help for the module help page', () => {
    const out = hooks.help('help.page.views_ui');
    expect(out).toContain('About');
    expect(out).toContain('Views UI module');
  });

  it('returns null for unrelated routes', () => {
    expect(hooks.help('some.other.route')).toBeNull();
  });
});

describe('ViewsUiHooks.entityTypeBuild', () => {
  it('wires the view entity forms/list-builder/link templates', () => {
    const hooks = new ViewsUiHooks();
    const entityTypes: Record<string, any> = { view: makeEntityType() };

    hooks.entityTypeBuild(entityTypes);

    const view = entityTypes.view;
    expect(view.getFormClass('edit')).toBe('ViewEditForm');
    expect(view.getFormClass('add')).toBe('ViewAddForm');
    expect(view.getFormClass('break_lock')).toBe('BreakLockForm');
    expect(view.getListBuilderClass()).toBe('ViewListBuilder');
    expect(view.getLinkTemplate('collection')).toBe('/admin/structure/views');
    expect(view.getLinkTemplate('enable')).toBe('/admin/structure/views/view/{view}/enable');
  });

  it('does nothing when the view entity type is absent', () => {
    const hooks = new ViewsUiHooks();
    expect(() => hooks.entityTypeBuild({})).not.toThrow();
  });
});

describe('ViewsUiHooks.viewsPluginsDisplayAlter', () => {
  it('attaches an edit_form contextual link to each display plugin', () => {
    const hooks = new ViewsUiHooks();
    const plugins: Record<string, DisplayPluginDefinition> = { page: {}, block: {} };

    hooks.viewsPluginsDisplayAlter(plugins);

    for (const key of ['page', 'block']) {
      const links = plugins[key]!['contextual links'] as any;
      expect(links['entity.view.edit_form'].route_name).toBe('entity.view.edit_form');
      expect(links['entity.view.edit_form'].route_parameters_names).toEqual({ view: 'id' });
    }
  });
});

describe('ViewsUiHooks.contextualLinksViewAlter', () => {
  it('rewrites the edit link to the display-edit route with display_id', () => {
    const hooks = new ViewsUiHooks();
    const element = {
      '#links': {
        'entityviewedit-form': {
          url: { route: 'entity.view.edit_form', parameters: { view: 'v' } },
        },
      },
    };
    const items = { 'entity.view.edit_form': { metadata: { display_id: 'page_1' } } };

    hooks.contextualLinksViewAlter(element, items);

    const url = element['#links']['entityviewedit-form'].url;
    expect(url.route).toBe('entity.view.edit_display_form');
    expect(url.parameters).toEqual({ view: 'v', display_id: 'page_1' });
  });

  it('does nothing when there is no edit link', () => {
    const hooks = new ViewsUiHooks();
    const element = {} as any;
    expect(() => hooks.contextualLinksViewAlter(element, {})).not.toThrow();
  });
});

describe('ViewsUiHooks.entityOperation', () => {
  function makeBlock(baseId: string, derivativeId: string): BlockEntityLike {
    return { getPlugin: () => ({ getBaseId: () => baseId, getDerivativeId: () => derivativeId }) };
  }

  it('adds an Edit view operation for editable views_block blocks', () => {
    const hooks = new ViewsUiHooks();
    const access: ViewAccessChecker = { canEdit: () => true };

    const ops = hooks.entityOperation(makeBlock('views_block', 'frontpage-page_1'), access);

    expect(ops['view-edit']!.title).toBe('Edit view');
    expect(ops['view-edit']!.url).toBe('/admin/structure/views/view/frontpage/edit/page_1');
  });

  it('returns no ops when the view is not editable', () => {
    const hooks = new ViewsUiHooks();
    const access: ViewAccessChecker = { canEdit: vi.fn(() => false) };
    expect(hooks.entityOperation(makeBlock('views_block', 'x-y'), access)).toEqual({});
  });

  it('ignores non-views_block blocks', () => {
    const hooks = new ViewsUiHooks();
    const access: ViewAccessChecker = { canEdit: () => true };
    expect(hooks.entityOperation(makeBlock('system_menu_block', 'main'), access)).toEqual({});
  });
});

describe('registerViewsUiHooks', () => {
  it('registers help under the views_ui module and dispatches via the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ views_ui: { name: 'views_ui' } });

    registerViewsUiHooks(handler, new ViewsUiHooks());

    expect(handler.hasImplementations('help', 'views_ui')).toBe(true);
    expect(handler.invoke('views_ui', 'help', ['help.page.views_ui'])).toContain('About');
  });

  it('registers the entity_type_build alter-style hook', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ views_ui: { name: 'views_ui' } });
    registerViewsUiHooks(handler, new ViewsUiHooks());

    const entityTypes: Record<string, any> = { view: makeEntityType() };
    handler.invoke('views_ui', 'entity_type_build', [entityTypes]);
    expect(entityTypes.view.getListBuilderClass()).toBe('ViewListBuilder');
  });
});

// --- Test double for an EntityType -----------------------------------------
function makeEntityType() {
  const formClasses: Record<string, string> = {};
  const linkTemplates: Record<string, string> = {};
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
  };
  return et;
}
