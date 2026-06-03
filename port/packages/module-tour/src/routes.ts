/**
 * Route definitions ported from `tour.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

import { ACCESS_TOUR } from './permissions.js';

export interface RouteRequirements {
  _permission?: string;
}

export interface RouteDefaults {
  _controller?: string;
}

export interface RouteDefinition {
  path: string;
  defaults: RouteDefaults;
  requirements: RouteRequirements;
}

/**
 * tour routes keyed by route name.
 *
 * `tour.tip` is the render endpoint exposed by `TourController::renderTip()`.
 */
export const TOUR_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'tour.tip': {
    path: '/tour/{tour}',
    defaults: { _controller: 'TourController::renderTour' },
    requirements: { _permission: ACCESS_TOUR },
  },
};
