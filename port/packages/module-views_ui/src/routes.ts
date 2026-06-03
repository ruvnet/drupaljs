/**
 * Route definitions ported from `views_ui.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * Only the non-AJAX-form routes are ported in this vertical slice; the
 * `views_ui.form_*` AJAX handler routes depend on the not-yet-ported Views
 * form/Ajax subsystem and are intentionally omitted.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

import { ADMINISTER_VIEWS } from './permissions.js';

export interface RouteRequirements {
  _permission?: string;
  _entity_access?: string;
  _entity_create_access?: string;
  _csrf_token?: string;
}

export interface RouteDefaults {
  _entity_list?: string;
  _entity_form?: string;
  _form?: string;
  _controller?: string;
  _title?: string;
  op?: string;
}

export interface RouteDefinition {
  path: string;
  defaults: RouteDefaults;
  requirements: RouteRequirements;
}

/** views_ui routes keyed by route name. */
export const VIEWS_UI_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'entity.view.collection': {
    path: '/admin/structure/views',
    defaults: { _entity_list: 'view', _title: 'Views' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'views_ui.add': {
    path: '/admin/structure/views/add',
    defaults: { _entity_form: 'view.add', _title: 'Add view' },
    requirements: { _entity_create_access: 'view' },
  },
  'views_ui.settings_basic': {
    path: '/admin/structure/views/settings',
    defaults: { _form: 'BasicSettingsForm', _title: 'Views settings' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'views_ui.settings_advanced': {
    path: '/admin/structure/views/settings/advanced',
    defaults: { _form: 'AdvancedSettingsForm', _title: 'Advanced Views settings' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'views_ui.reports_fields': {
    path: '/admin/reports/fields/views-fields',
    defaults: { _controller: 'ViewsUIController::reportFields', _title: 'Used in views' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'views_ui.reports_plugins': {
    path: '/admin/reports/views-plugins',
    defaults: { _controller: 'ViewsUIController::reportPlugins', _title: 'Views plugins' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'entity.view.enable': {
    path: '/admin/structure/views/view/{view}/enable',
    defaults: { _controller: 'ViewsUIController::ajaxOperation', op: 'enable' },
    requirements: { _entity_access: 'view.enable', _csrf_token: 'TRUE' },
  },
  'entity.view.disable': {
    path: '/admin/structure/views/view/{view}/disable',
    defaults: { _controller: 'ViewsUIController::ajaxOperation', op: 'disable' },
    requirements: { _entity_access: 'view.disable', _csrf_token: 'TRUE' },
  },
  'entity.view.duplicate_form': {
    path: '/admin/structure/views/view/{view}/duplicate',
    defaults: { _entity_form: 'view.duplicate', _title: 'Duplicate view' },
    requirements: { _entity_access: 'view.duplicate' },
  },
  'entity.view.delete_form': {
    path: '/admin/structure/views/view/{view}/delete',
    defaults: { _entity_form: 'view.delete', _title: 'Delete view' },
    requirements: { _entity_access: 'view.delete' },
  },
  'views_ui.autocomplete': {
    path: '/admin/views/ajax/autocomplete/tag',
    defaults: { _controller: 'ViewsUIController::autocompleteTag' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'entity.view.edit_form': {
    path: '/admin/structure/views/view/{view}',
    defaults: { _controller: 'ViewsUIController::edit' },
    requirements: { _entity_access: 'view.update' },
  },
  'entity.view.preview_form': {
    path: '/admin/structure/views/view/{view}/preview/{display_id}',
    defaults: { _entity_form: 'view.preview' },
    requirements: { _permission: ADMINISTER_VIEWS },
  },
  'entity.view.break_lock_form': {
    path: '/admin/structure/views/view/{view}/break-lock',
    defaults: { _entity_form: 'view.break_lock', _title: 'Break lock' },
    requirements: { _entity_access: 'view.break-lock' },
  },
};
