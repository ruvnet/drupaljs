/**
 * Port of `book.routing.yml`.
 *
 * Captures the module's primary routes: the admin overview, the per-book admin
 * edit page, the per-node outline form, the remove-from-outline confirmation,
 * and the printer-friendly export. Controller/form classes are kept as strings
 * (matching Drupal's _controller / _form route defaults) until those classes
 * are ported.
 */

/** A minimal route definition descriptor. Mirrors a Drupal routing.yml entry. */
export interface RouteDefinition {
  path: string;
  defaults: Record<string, string>;
  requirements: Record<string, string>;
}

/** Routes provided by the module, ported from book.routing.yml. */
export const bookRoutes: Record<string, RouteDefinition> = {
  'book.admin': {
    path: '/admin/structure/book',
    defaults: {
      _controller: 'BookController::adminOverview',
      _title: 'Books',
    },
    requirements: { _permission: 'administer book outlines' },
  },
  'book.settings': {
    path: '/admin/structure/book/settings',
    defaults: {
      _form: 'BookSettingsForm',
      _title: 'Settings',
    },
    requirements: { _permission: 'administer site configuration' },
  },
  'book.admin_edit': {
    path: '/admin/structure/book/{node}',
    defaults: {
      _form: 'BookAdminEditForm',
      _title: 'Re-order book pages and change titles',
    },
    requirements: { _permission: 'administer book outlines' },
  },
  'book.outline': {
    path: '/node/{node}/outline',
    defaults: {
      _form: 'BookOutlineForm',
      _title: 'Outline',
    },
    requirements: { _permission: 'administer book outlines' },
  },
  'book.remove': {
    path: '/node/{node}/outline/remove',
    defaults: {
      _form: '\\Drupal\\book\\Form\\BookRemoveForm',
      _title: 'Remove from outline',
    },
    requirements: { _permission: 'administer book outlines' },
  },
  'book.export': {
    path: '/book/export/{type}/{node}',
    defaults: {
      _controller: 'BookController::bookExport',
    },
    requirements: { _permission: 'access printer-friendly version' },
  },
};
