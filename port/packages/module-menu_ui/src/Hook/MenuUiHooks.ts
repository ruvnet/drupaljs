/**
 * Hook implementations for menu_ui.
 *
 * Ports the non-UI portions of `Drupal\menu_ui\Hook\MenuUiHooks`. Hooks that
 * depend on form-building, the full entity API, or runtime services (e.g.
 * `formNodeTypeFormAlter`, `nodeInsert`) are out of scope for this vertical
 * slice and left as TODOs.
 */

/**
 * Minimal mutable entity-type contract used by {@link MenuUiHooks.entityTypeBuild}.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityTypeInterface once the
 * entity package ships its config-entity-type port.
 */
export interface EntityTypeBuildTarget {
  setFormClass(operation: string, cls: string): EntityTypeBuildTarget;
  setListBuilderClass(cls: string): EntityTypeBuildTarget;
  setLinkTemplate(name: string, path: string): EntityTypeBuildTarget;
  addConstraint(name: string, options: unknown): EntityTypeBuildTarget;
}

/** Minimal block-plugin contract for the contextual-links alter hook. */
export interface BlockPluginLike {
  getBaseId(): string;
  getDerivativeId(): string;
}

export class MenuUiHooks {
  /**
   * Implements hook_help().
   *
   * Returns help text for the menu_ui help page; null otherwise. The
   * block-module-dependent variants from core are omitted (no module handler
   * dependency in this slice).
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.menu_ui') {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Menu UI module provides an interface for managing menus. ' +
        'A menu is a hierarchical collection of links, which can be within or ' +
        'external to the site, generally used for navigation.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Managing menus</dt>';
      output +=
        '<dd>Users with the <em>Administer menus and menu links</em> permission ' +
        'can add, edit, and delete custom menus on the Menus page.</dd>';
      output += '<dt>Displaying menus</dt>';
      output +=
        '<dd>If you have the Block module installed, then each menu that you ' +
        'create is rendered in a block that you enable and position on the ' +
        'Block layout page.</dd>';
      output += '</dl>';
      return output;
    }
    return null;
  }

  /**
   * Implements hook_entity_type_build().
   *
   * Wires the `menu` config entity to its forms, list builder, and link
   * templates, and adds the `MenuSettings` constraint to the `node` entity type
   * when present. Mutates `entityTypes` by reference (alter semantics).
   */
  entityTypeBuild(entityTypes: Record<string, EntityTypeBuildTarget>): void {
    const menu = entityTypes['menu'];
    if (menu !== undefined) {
      menu
        .setFormClass('add', 'MenuForm')
        .setFormClass('edit', 'MenuForm')
        .setFormClass('delete', 'MenuDeleteForm')
        .setListBuilderClass('MenuListBuilder')
        .setLinkTemplate('add-form', '/admin/structure/menu/add')
        .setLinkTemplate('delete-form', '/admin/structure/menu/manage/{menu}/delete')
        .setLinkTemplate('edit-form', '/admin/structure/menu/manage/{menu}')
        .setLinkTemplate('add-link-form', '/admin/structure/menu/manage/{menu}/add')
        .setLinkTemplate('collection', '/admin/structure/menu');
    }
    const node = entityTypes['node'];
    if (node !== undefined) {
      node.addConstraint('MenuSettings', {});
    }
  }

  /**
   * Implements hook_block_view_BASE_BLOCK_ID_alter() for 'system_menu_block'.
   *
   * Adds a contextual link pointing at the block's derivative menu so editors
   * can jump to that menu's management page. Mutates `build` by reference.
   */
  blockViewSystemMenuBlockAlter(
    build: Record<string, unknown>,
    block: BlockPluginLike,
  ): void {
    if (block.getBaseId() === 'system_menu_block') {
      const menuName = block.getDerivativeId();
      const contextual = (build['#contextual_links'] ??= {}) as Record<string, unknown>;
      contextual['menu'] = { route_parameters: { menu: menuName } };
    }
  }
}
