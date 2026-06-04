/**
 * @drupaljs/module-history — TypeScript port of Drupal core's `history` module.
 *
 * The history module tracks which content (nodes) a user has read, marking
 * content as new/updated/read and exposing "new comment" counts. This is a
 * faithful, minimal vertical slice:
 *
 * - {@link HistoryRepository}: ports the procedural read/write API
 *   (`history_read`, `history_read_multiple`, `history_write`), the
 *   `HISTORY_READ_LIMIT` (30-days) constant, and the `{history}` table shape
 *   from `history.install`.
 * - {@link HistoryManager}: ports `HistoryManager::getCountNewComments()`.
 * - {@link HistoryController}: ports the JSON endpoints `getNodeReadTimestamps`
 *   and `readNode` (with ported Access/NotFound HTTP exceptions).
 * - {@link historyRoutes}: faithful port of `history.routing.yml`.
 * - Hook implementations registered via `@drupaljs/hook`
 *   ({@link registerHistoryHooks}): help, cron, node_view_alter, node_delete,
 *   user_cancel, user_delete.
 *
 * Reference: drupal-core/core/modules/history.
 */

// Repository (procedural read/write API + read limit + table shape)
export {
  HistoryRepository,
  THIRTY_DAYS_SECONDS,
  type HistoryRow,
  type HistoryStorage,
  type HistoryAccount,
  type TimeService,
} from './history-repository.js';

// Manager service
export {
  HistoryManager,
  type EntityLike,
  type ModuleExistsProbe,
  type NewCommentCounter,
} from './history-manager.js';

// Controller (JSON endpoints) + ported HTTP exceptions
export {
  HistoryController,
  AccessDeniedHttpException,
  NotFoundHttpException,
} from './history-controller.js';

// Routing
export {
  historyRoutes,
  type RouteDefinition,
  type RouteRequirements,
} from './routing.js';

// Hooks
export {
  registerHistoryHooks,
  historyHelp,
  historyCron,
  historyNodeViewAlter,
  historyNodeDelete,
  historyUserCancel,
  historyUserDelete,
  MODULE_NAME,
  USER_CANCEL_REASSIGN,
  type NodeViewBuild,
  type NodeLike,
  type ViewDisplay,
} from './hooks.js';
