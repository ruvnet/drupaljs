/**
 * Port of `update.routing.yml`.
 *
 * A static route-definition map for the Update Status report pages. Controller
 * and form references keep the Drupal `_controller` / `_form` keys verbatim.
 *
 * TODO(@drupaljs/routing): consume these via the shared Route/RouteProvider
 * types once the routing package lands.
 */

export interface RouteDefinition {
  readonly path: string;
  readonly defaults?: Record<string, string>;
  readonly requirements?: Record<string, string>;
  readonly options?: Record<string, unknown>;
}

export const updateRoutes: Record<string, RouteDefinition> = {
  'update.settings': {
    path: '/admin/reports/updates/settings',
    defaults: {
      _form: '\\Drupal\\update\\UpdateSettingsForm',
      _title: 'Update Status settings',
    },
    requirements: { _permission: 'administer site configuration' },
  },
  'update.status': {
    path: '/admin/reports/updates',
    defaults: {
      _controller: '\\Drupal\\update\\Controller\\UpdateController::updateStatus',
      _title: 'Available updates',
    },
    requirements: { _permission: 'administer site configuration' },
  },
  'update.manual_status': {
    path: '/admin/reports/updates/check',
    defaults: {
      _title: 'Manual update check',
      _controller:
        '\\Drupal\\update\\Controller\\UpdateController::updateStatusManually',
    },
    requirements: {
      _permission: 'administer site configuration',
      _csrf_token: 'TRUE',
    },
  },
};
