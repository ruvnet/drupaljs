/**
 * @drupaljs/module-comment — TypeScript port of Drupal core's `comment` module.
 *
 * A faithful, minimal vertical slice of the comment subsystem:
 * - Entities: {@link Comment} (content entity) and {@link CommentType} (config
 *   bundle entity), with thread placement ported from Comment::preSave().
 * - Enums/constants: {@link CommentingStatus}, {@link AnonymousContact},
 *   {@link FormLocation}, {@link CommentPreviewMode}, published-state and
 *   threading-mode constants.
 * - Service: {@link CommentManager}.
 * - Access: {@link CommentAccessControlHandler} + {@link AccessResult}.
 * - Permissions ({@link commentPermissions}) and routes ({@link commentRoutes}).
 * - Hook implementations registered via `@drupaljs/hook`
 *   ({@link registerCommentHooks}).
 *
 * Reference: drupal-core/core/modules/comment.
 */

// Enums & constants
export {
  CommentingStatus,
  commentingStatusLabel,
  AnonymousContact,
  anonymousContactLabel,
  FormLocation,
  CommentPreviewMode,
  commentPreviewModeLabel,
  CommentMode,
  COMMENT_NOT_PUBLISHED,
  COMMENT_PUBLISHED,
} from './enums.js';

// Thread numbering helpers
export { intToAlphadecimal, alphadecimalToInt } from './thread.js';

// Permissions
export {
  CommentPermission,
  commentPermissions,
  type PermissionDefinition,
  type CommentPermissionName,
} from './permissions.js';

// Routing
export {
  commentRoutes,
  type RouteDefinition,
  type RouteRequirements,
} from './routing.js';

// Comment type (config bundle entity)
export {
  CommentType,
  type CommentTypeInterface,
  type CommentTypeValues,
} from './comment-type.js';

// Comment (content entity)
export {
  Comment,
  type CommentInterface,
  type CommentValues,
  type CommentThreadStorage,
  type LockBackend,
  type Account,
} from './comment.entity.js';

// Access control
export {
  CommentAccessControlHandler,
  AccessResult,
  type AccessAccount,
  type AccessOperation,
  type CommentedEntityAccess,
} from './comment-access.js';

// Manager service
export {
  CommentManager,
  type CommentManagerInterface,
  type CommentFieldMapProvider,
  type RolePermissionChecker,
  type ManagerAccount,
} from './comment-manager.js';

// Hooks
export {
  registerCommentHooks,
  commentHelp,
  commentEntityExtraFieldInfo,
  MODULE_NAME,
} from './hooks.js';
