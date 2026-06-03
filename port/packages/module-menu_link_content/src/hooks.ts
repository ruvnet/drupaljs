/**
 * Hook implementations for the `menu_link_content` module.
 *
 * Ports `Drupal\menu_link_content\Hook\MenuLinkContentHooks`. The PHP class
 * declares hooks via `#[Hook(...)]` attributes discovered by the container; in
 * the TS port hooks are registered explicitly against a `ModuleHandler` (see
 * `@drupaljs/hook`) by {@link registerMenuLinkContentHooks}.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { EntityTypeManagerInterface, MenuLinkManagerInterface } from './types.js';

/** This module's machine name. */
export const MODULE_NAME = 'menu_link_content';

/** Minimal menu config entity surface used by hook_menu_delete(). */
export interface MenuInterface {
  id(): string;
}

/** Minimal entity-type definition surface used by hook_entity_type_alter(). */
export interface AlterableEntityType {
  handlers: Record<string, string>;
  [key: string]: unknown;
}

export class MenuLinkContentHooks {
  constructor(
    private readonly entityTypeManager: EntityTypeManagerInterface,
    private readonly menuLinkManager: MenuLinkManagerInterface,
  ) {}

  /**
   * Implements hook_help().
   *
   * Returns help markup for this module's help route, or null otherwise.
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.menu_link_content') {
      return (
        '<h2>About</h2>' +
        '<p>The Custom Menu Links module allows users to create menu links. ' +
        'These links can be translated if multiple languages are used for the site.</p>'
      );
    }
    return null;
  }

  /**
   * Implements hook_entity_type_alter().
   *
   * Disables moderation for custom menu links (no revision UI yet).
   */
  entityTypeAlter(entityTypes: Record<string, AlterableEntityType>): void {
    const type = entityTypes[MODULE_NAME];
    if (type) {
      type.handlers.moderation = '';
    }
  }

  /**
   * Implements hook_ENTITY_TYPE_delete() for menus.
   *
   * Deletes every custom menu link belonging to the menu being removed.
   */
  menuDelete(menu: MenuInterface): void {
    const storage = this.entityTypeManager.getStorage(MODULE_NAME);
    const links = storage.loadByProperties({ menu_name: menu.id() });
    storage.delete(links);
  }

  /**
   * Implements hook_entity_predelete().
   *
   * Deletes content menu links that point to the route of the entity being
   * deleted. The route discovery here is intentionally minimal.
   */
  entityPredelete(routeName: string, routeParameters: Record<string, unknown>): void {
    const result = this.menuLinkManager.loadLinksByRoute(routeName, routeParameters);
    for (const [id, instance] of Object.entries(result)) {
      if (instance.isDeletable() && id.startsWith('menu_link_content:')) {
        instance.deleteLink();
      }
    }
  }
}

/**
 * Registers this module's hook implementations against a module handler,
 * mirroring Drupal's `#[Hook]` attribute discovery.
 */
export function registerMenuLinkContentHooks(
  moduleHandler: ModuleHandlerInterface,
  hooks: MenuLinkContentHooks,
): void {
  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));
  moduleHandler.implement(MODULE_NAME, 'entity_type_alter', (entityTypes) =>
    hooks.entityTypeAlter(entityTypes as Record<string, AlterableEntityType>),
  );
  moduleHandler.implement(MODULE_NAME, 'menu_delete', (menu) =>
    hooks.menuDelete(menu as MenuInterface),
  );
}
