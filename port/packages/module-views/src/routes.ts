import type { RouteCollection } from './contracts.js';

/**
 * Static routes from `views.routing.yml`.
 *
 * The `views` module defines a single static route — the AJAX endpoint used by
 * exposed forms, pagers, and previews. Drupal also registers dynamic routes via
 * a `route_callbacks` route subscriber (one per view display that has a path);
 * that dynamic generation is deferred until the display Page/Feed plugins land.
 * The admin UI routes live in the separate `views_ui` module.
 */
export const viewsRoutes: RouteCollection = {
  'views.ajax': {
    path: '/views/ajax',
    defaults: {
      // TODO(@drupaljs/module-views): ViewAjaxController::ajaxView controller.
      _controller: 'views.ajax:ajaxView',
    },
    requirements: {
      _access: 'TRUE',
    },
  },
};
