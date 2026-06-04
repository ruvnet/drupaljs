/**
 * Route definitions ported from `menu_ui.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

import { ADMINISTER_MENU } from './permissions.js';

export interface RouteRequirements {
  _permission?: string;
  _entity_access?: string;
  _entity_create_access?: string;
  _custom_access?: string;
}

export interface RouteDefaults {
  _entity_list?: string;
  _entity_form?: string;
  _form?: string;
  _controller?: string;
  _title?: string;
  _title_callback?: string;
}

export interface RouteDefinition {
  path: string;
  defaults: RouteDefaults;
  requirements: RouteRequirements;
}

/** menu_ui routes keyed by route name. */
export const MENU_UI_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'entity.menu.collection': {
    path: '/admin/structure/menu',
    defaults: { _entity_list: 'menu', _title: 'Menus' },
    requirements: { _permission: ADMINISTER_MENU },
  },
  'menu_ui.parent_options_js': {
    path: '/admin/structure/menu/parents',
    defaults: { _controller: 'MenuController::getParentOptions' },
    requirements: { _permission: ADMINISTER_MENU },
  },
  'menu_ui.link_edit': {
    path: '/admin/structure/menu/link/{menu_link_plugin}/edit',
    defaults: { _form: 'MenuLinkEditForm', _title: 'Edit menu link' },
    requirements: { _permission: ADMINISTER_MENU },
  },
  'menu_ui.link_reset': {
    path: '/admin/structure/menu/link/{menu_link_plugin}/reset',
    defaults: { _form: 'MenuLinkResetForm', _title: 'Reset menu link' },
    requirements: {
      _permission: ADMINISTER_MENU,
      _custom_access: 'MenuLinkResetForm::linkIsResettable',
    },
  },
  'entity.menu.add_form': {
    path: '/admin/structure/menu/add',
    defaults: { _entity_form: 'menu.add', _title: 'Add menu' },
    requirements: { _entity_create_access: 'menu' },
  },
  'entity.menu.edit_form': {
    path: '/admin/structure/menu/manage/{menu}',
    defaults: { _entity_form: 'menu.edit', _title_callback: 'MenuController::menuTitle' },
    requirements: { _entity_access: 'menu.update' },
  },
  'entity.menu.delete_form': {
    path: '/admin/structure/menu/manage/{menu}/delete',
    defaults: { _entity_form: 'menu.delete', _title: 'Delete menu' },
    requirements: { _entity_access: 'menu.delete' },
  },
};
