/**
 * Route definitions ported from `contextual.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

import { ACCESS_CONTEXTUAL_LINKS } from './permissions.js';

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

/** contextual routes keyed by route name. */
export const CONTEXTUAL_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'contextual.render': {
    path: '/contextual/render',
    defaults: { _controller: 'ContextualController::render' },
    requirements: { _permission: ACCESS_CONTEXTUAL_LINKS },
  },
};
