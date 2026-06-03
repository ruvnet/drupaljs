/**
 * File module routes.
 *
 * Ports drupal-core/core/modules/file/file.routing.yml. The Symfony route
 * structure is modelled as a plain object; controller dispatch is wired by the
 * routing package, so `defaults._controller` carries the symbolic controller id.
 */

export interface RouteDefinition {
  path: string;
  defaults?: Record<string, string>;
  requirements?: Record<string, string>;
}

/** Keyed by route name. */
export const fileRoutes: Record<string, RouteDefinition> = {
  'file.ajax_progress': {
    path: '/file/progress/{key}',
    defaults: {
      // TODO(@drupaljs/module-file): port FileWidgetAjaxController::progress.
      _controller: 'file.FileWidgetAjaxController::progress',
    },
    requirements: {
      _permission: 'access content',
    },
  },
};
