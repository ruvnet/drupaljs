/**
 * dblog module routes — TypeScript port of `core/modules/dblog/dblog.routing.yml`.
 *
 * Each entry constructs a `@drupaljs/routing` {@link Route} with the same path,
 * `defaults` (`_controller` / `_form` / `_title` / `type`) and `requirements`
 * (`_permission` / `_module_dependencies`) as the YAML. Controller/form class
 * strings are preserved verbatim (Drupal-style FQCNs).
 */
import { Route } from '@drupaljs/routing';

export const dblogRoutes: Readonly<Record<string, Route>> = {
  'dblog.overview': new Route(
    '/admin/reports/dblog',
    {
      _controller: '\\Drupal\\dblog\\Controller\\DbLogController::overview',
      _title: 'Recent log messages',
    },
    { _permission: 'access site reports' },
  ),
  'dblog.confirm': new Route(
    '/admin/reports/dblog/confirm',
    {
      _form: '\\Drupal\\dblog\\Form\\DblogClearLogConfirmForm',
      _title: 'Confirm delete recent log messages',
    },
    { _permission: 'access site reports' },
  ),
  'dblog.event': new Route(
    '/admin/reports/dblog/event/{event_id}',
    {
      _controller: '\\Drupal\\dblog\\Controller\\DbLogController::eventDetails',
      _title: 'Details',
    },
    { _permission: 'access site reports' },
  ),
  'dblog.page_not_found': new Route(
    '/admin/reports/page-not-found',
    {
      _title: "Top 'page not found' errors",
      _controller: '\\Drupal\\dblog\\Controller\\DbLogController::topLogMessages',
      type: 'page not found',
    },
    { _permission: 'access site reports' },
  ),
  'dblog.access_denied': new Route(
    '/admin/reports/access-denied',
    {
      _title: "Top 'access denied' errors",
      _controller: '\\Drupal\\dblog\\Controller\\DbLogController::topLogMessages',
      type: 'access denied',
    },
    { _permission: 'access site reports' },
  ),
  'dblog.search': new Route(
    '/admin/reports/search',
    {
      _controller: '\\Drupal\\dblog\\Controller\\DbLogController::topLogMessages',
      _title: 'Top search phrases',
      type: 'search',
    },
    {
      _module_dependencies: 'search',
      _permission: 'access site reports',
    },
  ),
};
