/**
 * History module route definitions. Faithful port of `history.routing.yml`.
 *
 * Controller references are kept as opaque string identifiers (as in the YAML);
 * the JSON controller logic itself lives in {@link HistoryController}.
 *
 * TODO(@drupaljs/routing): replace `RouteDefinition` with the shared Route type
 * once the routing package lands; this local shape models only the fields the
 * history routes use.
 */

export interface RouteRequirements {
  /** `_permission` — required permission machine name. */
  readonly permission?: string;
  /** `_entity_access` — entity operation requirement, e.g. "node.view". */
  readonly entityAccess?: string;
  /** Per-slug regex requirements, e.g. `{ node: '\\d+' }`. */
  readonly slugPatterns?: Readonly<Record<string, string>>;
}

export interface RouteDefinition {
  /** Route path with `{slug}` placeholders. */
  readonly path: string;
  /** `_controller` callable identifier. */
  readonly controller: string;
  /** Access requirements. */
  readonly requirements: RouteRequirements;
}

/** History routes keyed by Drupal route name. */
export const historyRoutes: Record<string, RouteDefinition> = {
  'history.get_last_node_view': {
    path: '/history/get_node_read_timestamps',
    controller: '\\Drupal\\history\\Controller\\HistoryController::getNodeReadTimestamps',
    requirements: { permission: 'access content' },
  },
  'history.read_node': {
    path: '/history/{node}/read',
    controller: '\\Drupal\\history\\Controller\\HistoryController::readNode',
    requirements: { entityAccess: 'node.view', slugPatterns: { node: '\\d+' } },
  },
  'history.new_comments_node_links': {
    path: '/history/render_new_comments_node_links',
    controller: '\\Drupal\\history\\Controller\\HistoryController::renderNewCommentsNodeLinks',
    requirements: { permission: 'access content' },
  },
};
