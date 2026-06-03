import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { MenuLinkContentHooks, registerMenuLinkContentHooks, MODULE_NAME } from './hooks.js';
import { MenuLinkContent } from './entity.js';
import type {
  EntityTypeManagerInterface,
  MenuLinkContentStorageInterface,
  MenuLinkManagerInterface,
  MenuLinkPluginDefinition,
  MenuLinkInstance,
} from './types.js';

function makeStorage(entities: MenuLinkContent[]) {
  return {
    entities,
    loadMultiple: vi.fn(() => Object.fromEntries(entities.map((e) => [e.getUuid(), e]))),
    loadByProperties: vi.fn((_p: Record<string, unknown>) => entities),
    delete: vi.fn(),
  } satisfies MenuLinkContentStorageInterface & { entities: MenuLinkContent[] };
}

function makeManager() {
  return {
    getDefinition: vi.fn<(id: string) => MenuLinkPluginDefinition | undefined>(() => undefined),
    addDefinition: vi.fn(),
    updateDefinition: vi.fn(),
    removeDefinition: vi.fn(),
    loadLinksByRoute: vi.fn<() => Record<string, MenuLinkInstance>>(() => ({})),
  } as unknown as MenuLinkManagerInterface & Record<string, ReturnType<typeof vi.fn>>;
}

describe('MenuLinkContentHooks.menuDelete', () => {
  it('deletes all menu_link_content entities belonging to the deleted menu', () => {
    const storage = makeStorage([
      MenuLinkContent.create({ uuid: 'l1', title: 'A', link: { uri: 'https://a.test' } }),
    ]);
    const etm: EntityTypeManagerInterface = { getStorage: () => storage };
    const hooks = new MenuLinkContentHooks(etm, makeManager());

    hooks.menuDelete({ id: () => 'main' });

    expect(storage.loadByProperties).toHaveBeenCalledWith({ menu_name: 'main' });
    expect(storage.delete).toHaveBeenCalledWith(storage.entities);
  });
});

describe('MenuLinkContentHooks.entityTypeAlter', () => {
  it('disables the moderation handler for menu_link_content', () => {
    const etm: EntityTypeManagerInterface = { getStorage: () => makeStorage([]) };
    const hooks = new MenuLinkContentHooks(etm, makeManager());
    const types: Record<string, { handlers: Record<string, string> }> = {
      menu_link_content: { handlers: { moderation: 'SomeHandler' } },
    };
    hooks.entityTypeAlter(types);
    expect(types['menu_link_content']?.handlers.moderation).toBe('');
  });
});

describe('MenuLinkContentHooks.help', () => {
  it('returns help text for the module help route and null otherwise', () => {
    const etm: EntityTypeManagerInterface = { getStorage: () => makeStorage([]) };
    const hooks = new MenuLinkContentHooks(etm, makeManager());
    expect(hooks.help('help.page.menu_link_content')).toContain('Custom Menu Links');
    expect(hooks.help('help.page.node')).toBeNull();
  });
});

describe('registerMenuLinkContentHooks', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
  });

  it('registers help, entity_type_alter and menu_delete on the module handler', () => {
    const etm: EntityTypeManagerInterface = { getStorage: () => makeStorage([]) };
    const hooks = new MenuLinkContentHooks(etm, makeManager());
    registerMenuLinkContentHooks(handler, hooks);

    expect(handler.hasImplementations('help', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('entity_type_alter', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('menu_delete', MODULE_NAME)).toBe(true);
  });

  it('the registered help hook is invokable through the handler', () => {
    const etm: EntityTypeManagerInterface = { getStorage: () => makeStorage([]) };
    const hooks = new MenuLinkContentHooks(etm, makeManager());
    registerMenuLinkContentHooks(handler, hooks);
    const out = handler.invoke(MODULE_NAME, 'help', ['help.page.menu_link_content']);
    expect(out).toContain('Custom Menu Links');
  });
});
