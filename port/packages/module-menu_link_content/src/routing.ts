/**
 * Routes and permissions for the `menu_link_content` module.
 *
 * Ports `menu_link_content.routing.yml`. The module itself defines no
 * permissions file; it relies on the core `administer menu` and the link
 * subsystem's `link to any page` permission, captured here as the set of
 * permission strings this module checks.
 */

/** A minimal route definition descriptor. Mirrors a Drupal routing.yml entry. */
export interface RouteDefinition {
  path: string;
  defaults: Record<string, string>;
  requirements: Record<string, string>;
}

/** Permission strings consulted by this module's access control. */
export const menuLinkContentPermissions = ['administer menu', 'link to any page'] as const;

/** Routes provided by the module, ported from menu_link_content.routing.yml. */
export const menuLinkContentRoutes: Record<string, RouteDefinition> = {
  'entity.menu.add_link_form': {
    path: '/admin/structure/menu/manage/{menu}/add',
    defaults: {
      _controller: 'MenuController::addLink',
      _title: 'Add menu link',
    },
    requirements: { _entity_create_access: 'menu_link_content' },
  },
  'entity.menu_link_content.canonical': {
    path: '/admin/structure/menu/item/{menu_link_content}/edit',
    defaults: { _entity_form: 'menu_link_content.default', _title: 'Edit menu link' },
    requirements: { _entity_access: 'menu_link_content.update' },
  },
  'entity.menu_link_content.edit_form': {
    path: '/admin/structure/menu/item/{menu_link_content}/edit',
    defaults: { _entity_form: 'menu_link_content.default', _title: 'Edit menu link' },
    requirements: { _entity_access: 'menu_link_content.update' },
  },
  'entity.menu_link_content.delete_form': {
    path: '/admin/structure/menu/item/{menu_link_content}/delete',
    defaults: { _entity_form: 'menu_link_content.delete', _title: 'Delete menu link' },
    requirements: { _entity_access: 'menu_link_content.delete' },
  },
};
