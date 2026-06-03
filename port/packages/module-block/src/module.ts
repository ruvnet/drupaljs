/**
 * The `block` module: definition, permissions, routes and hook wiring.
 *
 * Ports `core/modules/block`'s `block.info.yml`, `block.permissions.yml`,
 * `block.routing.yml`, `block.services.yml` and the `#[Hook]` implementations in
 * `Drupal\block\Hook\BlockHooks`. Discovery in Drupal is attribute-driven; here
 * implementations are registered explicitly through `@drupaljs/hook`'s
 * `ModuleHandler.implement()` (per that package's registration model).
 *
 * The hook bodies are reduced to the structural, side-effect-light behaviour the
 * vertical slice needs (e.g. `hook_theme` returns the `block` theme hook;
 * entity-cleanup hooks strip a deleted role/language from visibility config).
 * Deep collaborators (theme handler list, messenger, config installer) are
 * injected via {@link BlockHookServices}; sensible no-op defaults keep the
 * registration usable without a full container.
 */
import type { ModuleHandlerInterface, Module } from '@drupaljs/hook';
import type { BlockInterface } from './entity/block.js';

/**
 * Stable list cache tag for block config entities.
 * Ports Block::getCacheTagsToInvalidate() using the entity-type list cache tag.
 */
export const BLOCK_LIST_CACHE_TAG = 'config:block_list';

/** The module descriptor (ported from block.info.yml). */
export const blockModule: Module = {
  name: 'block',
  weight: 0,
  info: {
    dependencies: ['system'],
    path: 'core/modules/block',
    package: 'Core',
    type: 'module',
  },
};

/** Ported from block.permissions.yml. */
export const blockPermissions: Record<string, { title: string }> = {
  'administer blocks': { title: 'Administer blocks' },
};

/** A route definition (subset of Symfony routing used by core .routing.yml). */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: Record<string, string>;
  options?: Record<string, unknown>;
}

/** Ported from block.routing.yml (admin + entity CRUD routes). */
export const blockRoutes: Record<string, RouteDefinition> = {
  'block.admin_display': {
    path: '/admin/structure/block',
    defaults: { _title: 'Block layout' },
    requirements: { _permission: 'administer blocks' },
  },
  'block.admin_display_theme': {
    path: '/admin/structure/block/list/{theme}',
    defaults: { _title: 'Block layout' },
    requirements: { _access_theme: 'TRUE', _permission: 'administer blocks' },
  },
  'block.admin_library': {
    path: '/admin/structure/block/library/{theme}',
    defaults: { _title: 'Place block' },
    requirements: { _access_theme: 'TRUE', _permission: 'administer blocks' },
  },
  'block.admin_add': {
    path: '/admin/structure/block/add/{plugin_id}/{theme}',
    defaults: { theme: null, _title: 'Configure block' },
    requirements: { _permission: 'administer blocks' },
  },
  'entity.block.edit_form': {
    path: '/admin/structure/block/manage/{block}',
    defaults: { _entity_form: 'block.default', _title: 'Configure block' },
    requirements: { _entity_access: 'block.update' },
  },
  'entity.block.delete_form': {
    path: '/admin/structure/block/manage/{block}/delete',
    defaults: { _entity_form: 'block.delete', _title: 'Remove block' },
    requirements: { _permission: 'administer blocks' },
  },
  'entity.block.enable': {
    path: '/admin/structure/block/manage/{block}/enable',
    defaults: { op: 'enable' },
    requirements: { _entity_access: 'block.enable', _csrf_token: 'TRUE' },
  },
  'entity.block.disable': {
    path: '/admin/structure/block/manage/{block}/disable',
    defaults: { op: 'disable' },
    requirements: { _entity_access: 'block.disable', _csrf_token: 'TRUE' },
  },
};

/** Theme handler / messenger collaborators used by block hooks. */
export interface BlockHookServices {
  /** Active theme names, used by themes_installed / rebuild. */
  listThemes?(): string[];
  /** Regions defined by a theme, used by rebuild to detect invalid regions. */
  listThemeRegions?(theme: string): string[];
  defaultRegion?(theme: string): string;
  /** All block entities, used by entity-cleanup hooks (user_role/menu/language). */
  loadAllBlocks?(): BlockInterface[];
  saveBlock?(block: BlockInterface): void;
  deleteBlock?(block: BlockInterface): void;
}

/**
 * Registers the block module's hook implementations on a ModuleHandler.
 * Ports the `#[Hook]`-annotated methods of `Drupal\block\Hook\BlockHooks`.
 */
export function installBlockModule(
  handler: ModuleHandlerInterface,
  services: BlockHookServices = {},
): void {
  // hook_theme(): declares the `block` theme hook (template + preprocess).
  handler.implement('block', 'theme', () => ({
    block: {
      render_element: 'elements',
      template: 'block',
      initial_preprocess: 'block:preprocessBlock',
    },
  }));

  // hook_modules_installed(): no block creation during config sync.
  handler.implement('block', 'modules_installed', (_modules: string[], isSyncing?: boolean) => {
    if (isSyncing) return;
    // Theme initialization is delegated to the (stubbed) theme service.
    for (const theme of services.listThemes?.() ?? []) {
      void theme; // themeInitialize(theme) — handled by the theme subsystem.
    }
  });

  // hook_themes_installed(): initialise blocks for newly installed themes.
  handler.implement('block', 'themes_installed', (themeList: string[] = []) => {
    for (const theme of themeList) {
      void theme; // themeInitialize(theme) — handled by the theme subsystem.
    }
  });

  // hook_rebuild(): disable blocks placed in regions the theme no longer defines.
  handler.implement('block', 'rebuild', () => {
    for (const theme of services.listThemes?.() ?? []) {
      const regions = new Set(services.listThemeRegions?.(theme) ?? []);
      const fallback = services.defaultRegion?.(theme) ?? '';
      for (const block of services.loadAllBlocks?.() ?? []) {
        if (block.getTheme() !== theme) continue;
        const region = block.getRegion();
        if (region === undefined || !regions.has(region)) {
          block.setRegion(fallback).disable();
          services.saveBlock?.(block);
        }
      }
    }
  });

  // hook_ENTITY_TYPE_delete() for user_role: strip the role from visibility.
  handler.implement('block', 'user_role_delete', (role: { id: string }) => {
    for (const block of services.loadAllBlocks?.() ?? []) {
      const visibility = block.getVisibility();
      const userRole = visibility.user_role as { roles?: Record<string, unknown> } | undefined;
      if (userRole?.roles && role.id in userRole.roles) {
        const roles = { ...userRole.roles };
        delete roles[role.id];
        block.setVisibilityConfig('user_role', { ...userRole, roles });
        services.saveBlock?.(block);
      }
    }
  });

  // hook_ENTITY_TYPE_delete() for configurable_language: strip the langcode.
  handler.implement('block', 'configurable_language_delete', (language: { id: string }) => {
    for (const block of services.loadAllBlocks?.() ?? []) {
      const visibility = block.getVisibility();
      const lang = visibility.language as { langcodes?: Record<string, unknown> } | undefined;
      if (lang?.langcodes && language.id in lang.langcodes) {
        const langcodes = { ...lang.langcodes };
        delete langcodes[language.id];
        block.setVisibilityConfig('language', { ...lang, langcodes });
        services.saveBlock?.(block);
      }
    }
  });

  // hook_ENTITY_TYPE_delete() for menu: delete blocks bound to the menu.
  handler.implement('block', 'menu_delete', (menu: { id: string }) => {
    for (const block of services.loadAllBlocks?.() ?? []) {
      if (block.getPluginId() === `system_menu_block:${menu.id}`) {
        services.deleteBlock?.(block);
      }
    }
  });
}
