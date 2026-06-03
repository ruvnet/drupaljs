/**
 * Route definitions ported from `toolbar.routing.yml`.
 *
 * Modelled as a structured map rather than YAML. The routing subsystem
 * (`@drupaljs/routing`) is still a scaffold, so this uses a LOCAL route shape.
 *
 * TODO(@drupaljs/routing): re-key these onto the shared Route type when it lands.
 */

export interface RouteRequirements {
  _permission?: string;
  _custom_access?: string;
}

export interface RouteDefaults {
  _controller?: string;
  _title?: string;
}

export interface RouteDefinition {
  path: string;
  defaults: RouteDefaults;
  requirements: RouteRequirements;
}

/** toolbar routes keyed by route name. */
export const TOOLBAR_ROUTES: Readonly<Record<string, RouteDefinition>> = {
  'toolbar.subtrees': {
    path: '/toolbar/subtrees/{hash}',
    defaults: { _controller: 'ToolbarController::subtreesAjax' },
    requirements: { _custom_access: 'ToolbarController::checkSubTreeAccess' },
  },
};
