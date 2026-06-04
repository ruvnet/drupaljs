/**
 * Route definitions ported from `shortcut.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

export interface RouteRequirements {
  _permission?: string;
  _entity_access?: string;
  _entity_create_access?: string;
  _entity_list?: string;
  _custom_access?: string;
  _csrf_token?: boolean;
  [param: string]: unknown;
}

export interface RouteDefaults {
  _controller?: string;
  _form?: string;
  _entity_form?: string;
  _entity_list?: string;
  _title?: string;
}

export interface RouteDefinition {
  path: string;
  defaults: RouteDefaults;
  requirements: RouteRequirements;
}

/** shortcut routes keyed by route name. */
export const SHORTCUT_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'entity.shortcut_set.delete_form': {
    path: '/admin/config/user-interface/shortcut/manage/{shortcut_set}/delete',
    defaults: { _entity_form: 'shortcut_set.delete', _title: 'Delete shortcut set' },
    requirements: { _entity_access: 'shortcut_set.delete' },
  },
  'entity.shortcut_set.collection': {
    path: '/admin/config/user-interface/shortcut',
    defaults: { _entity_list: 'shortcut_set', _title: 'Shortcuts' },
    requirements: { _permission: 'administer shortcuts' },
  },
  'shortcut.set_add': {
    path: '/admin/config/user-interface/shortcut/add-set',
    defaults: { _entity_form: 'shortcut_set.add', _title: 'Add shortcut set' },
    requirements: { _entity_create_access: 'shortcut_set' },
  },
  'entity.shortcut_set.edit_form': {
    path: '/admin/config/user-interface/shortcut/manage/{shortcut_set}',
    defaults: { _entity_form: 'shortcut_set.edit', _title: 'Edit shortcut set' },
    requirements: { _entity_access: 'shortcut_set.update' },
  },
  'entity.shortcut_set.customize_form': {
    path: '/admin/config/user-interface/shortcut/manage/{shortcut_set}/customize',
    defaults: { _entity_form: 'shortcut_set.customize', _title: 'List links' },
    requirements: { _entity_access: 'shortcut_set.update' },
  },
  'shortcut.link_add': {
    path: '/admin/config/user-interface/shortcut/manage/{shortcut_set}/add-link',
    defaults: { _controller: 'ShortcutController::addForm', _title: 'Add link' },
    requirements: { _entity_create_access: 'shortcut:{shortcut_set}' },
  },
  'entity.shortcut.canonical': {
    path: '/admin/config/user-interface/shortcut/link/{shortcut}',
    defaults: { _entity_form: 'shortcut.default', _title: 'Edit' },
    requirements: { _entity_access: 'shortcut.update', shortcut: '\\d+' },
  },
  'entity.shortcut.delete_form': {
    path: '/admin/config/user-interface/shortcut/link/{shortcut}/delete',
    defaults: { _entity_form: 'shortcut.delete', _title: 'Delete' },
    requirements: { _entity_access: 'shortcut.delete', shortcut: '\\d+' },
  },
  'shortcut.set_switch': {
    path: '/user/{user}/shortcuts',
    defaults: { _form: 'SwitchShortcutSet', _title: 'Shortcuts' },
    requirements: { _custom_access: 'SwitchShortcutSet::checkAccess', user: '\\d+' },
  },
};
