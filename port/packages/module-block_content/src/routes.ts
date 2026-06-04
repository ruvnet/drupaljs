/**
 * Port of `block_content.routing.yml` (the statically declared routes; the
 * entity links / route_provider routes are derived elsewhere).
 *
 * @see drupal-core/core/modules/block_content/block_content.routing.yml
 */

import type { RouteCollection } from './types.js';

export const ROUTES: RouteCollection = {
  'block_content.add_form': {
    path: '/block/add/{block_content_type}',
    defaults: {
      _controller:
        'Drupal\\block_content\\Controller\\BlockContentController::addForm',
      _title_callback:
        'Drupal\\block_content\\Controller\\BlockContentController::getAddFormTitle',
    },
    options: { _admin_route: true },
    requirements: {
      _entity_create_access: 'block_content:{block_content_type}',
    },
  },
};

/** Returns a shallow copy of the route collection. */
export function getRoutes(): RouteCollection {
  return { ...ROUTES };
}
