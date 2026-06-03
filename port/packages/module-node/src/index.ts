/**
 * @drupaljs/module-node — TypeScript port of Drupal core's `node` module.
 *
 * A faithful, minimal vertical slice of the node module:
 *
 * - Entities: {@link Node} (content entity) and {@link NodeType} (bundle / config
 *   entity), with the {@link NodePreviewMode} enum and Drupal's status constants.
 * - Access: {@link NodeAccessControlHandler}, porting the view/create/field
 *   access logic and the default grant.
 * - Permissions: {@link nodePermissions} (static, from node.permissions.yml) and
 *   {@link nodeTypePermissions} (dynamic per-bundle, from NodePermissions).
 * - Routes: {@link nodeRoutes}, a subset of node.routing.yml.
 * - Hooks: {@link nodeNodeAccess} / {@link nodeNodeGrants} implementations and
 *   {@link registerNodeHooks} to wire them into a `@drupaljs/hook` ModuleHandler.
 *
 * Deep dependencies (full entity/field API, node-grants DB storage, forms,
 * controllers, string translation) are stubbed via local contracts marked with
 * TODO; see `./contracts.ts`.
 */

// Entities
export {
  Node,
  NodePublishStatus,
  NodePromoteStatus,
  NodeStickyStatus,
  type NodeInterface,
  type NodeValues,
} from './entity/node.js';
export {
  NodeType,
  NodePreviewMode,
  type NodeTypeInterface,
  type NodeTypeValues,
} from './entity/node-type.js';

// Access control
export {
  NodeAccessControlHandler,
  type NodeAccessGrant,
} from './access/node-access-control-handler.js';

// Permissions
export { nodePermissions, nodeTypePermissions } from './permissions.js';

// Routes
export { nodeRoutes } from './routes.js';

// Hooks
export { nodeNodeAccess, nodeNodeGrants, registerNodeHooks } from './hooks.js';

// Shared local contracts (re-exported so consumers can satisfy the access API).
export {
  AccessResult,
  type AccessVerdict,
  type AccountInterface,
  type PermissionDefinition,
  type PermissionMap,
  type RouteDefinition,
  type RouteCollection,
} from './contracts.js';
