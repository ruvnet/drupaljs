/**
 * @drupaljs/module-views — TypeScript port of Drupal core's `views` module.
 *
 * `views` is the largest module in Drupal core. This package ships a faithful,
 * **minimal vertical slice** of its query/display/handler engine — enough to
 * build, execute, and render a list view end-to-end without a database — and
 * defers the long tail (see "Deferred", below) to follow-up sub-tasks per
 * ADR-0018 (which calls out views as "the largest, split into sub-tasks").
 *
 * ## What is included (the vertical slice)
 *
 * - {@link ViewExecutable} — the orchestrator. Ports `Drupal\views\ViewExecutable`'s
 *   `build()` -> `execute()` -> `render()` lifecycle, including firing the
 *   `views_pre_build`, `views_pre_execute`, and `views_post_execute` hooks via a
 *   `@drupaljs/hook` ModuleHandler, and refusing disabled displays.
 * - {@link ResultRow} — ports `Drupal\views\ResultRow`.
 * - Query plugin: {@link QueryPluginInterface} (ports the QueryPluginBase
 *   contract) and {@link ArrayQuery}, an in-memory implementation (the DB-backed
 *   `Sql` plugin is deferred until `@drupaljs/database`). Supports field
 *   selection, WHERE groups with per-group AND/OR and a cross-group operator,
 *   `=,<>,>,>=,<,<=,IN,NOT IN,CONTAINS`, ORDER BY, and limit/offset.
 * - Display plugin: {@link DefaultDisplay} (ports DefaultDisplay/DisplayPluginBase
 *   handler collections + items-per-page/offset + enabled flag).
 * - Handlers: {@link StandardField} (ports FieldPluginBase: query/getValue/render),
 *   {@link StandardFilter} (ports FilterPluginBase: operator+value -> WHERE), and
 *   {@link StandardSort} (ports SortPluginBase: ORDER BY), over {@link HandlerBase}.
 * - Access: {@link PermissionAccess} — ports the views "Permission" access plugin.
 * - {@link viewsPermissions}, {@link viewsRoutes} (the `views.ajax` route), and
 *   the hook implementation {@link viewsHelp} wired by {@link registerViewsHooks}.
 *
 * ## Deferred (follow-up sub-tasks)
 *
 * - The SQL query plugin (`Sql`, DateSql, joins, aggregation, count queries),
 *   pending `@drupaljs/database`.
 * - Routed/embedded displays (Page, Block, Feed, Attachment, EntityReference)
 *   and the `route_callbacks` dynamic route subscriber.
 * - Pager, exposed-form, cache, style, and row plugins; arguments/contextual
 *   filters; relationship handlers; entity loading (`loadEntities`).
 * - `EntityViewsData` / `hook_views_data`, the Views config entity + storage,
 *   the analyzer, and the admin UI (`views_ui`, separately owned).
 *
 * Types from not-yet-ported subsystems (Account/AccessResult/Route/Permission)
 * are provided as minimal LOCAL contracts in `./contracts` and marked with TODO.
 */

// Orchestration
export { ViewExecutable } from './view-executable.js';
export type { ViewExecutableOptions, RenderedView } from './view-executable.js';

// Result model
export { ResultRow } from './result-row.js';

// Query plugin
export { ArrayQuery } from './plugin/query/array-query.js';
export type { ArrayRecord } from './plugin/query/array-query.js';
export type {
  QueryPluginInterface,
  ViewLike,
  QueryCondition,
  QueryWhereGroup,
  QueryOrderBy,
} from './plugin/query/query-plugin-interface.js';

// Display plugin
export { DefaultDisplay } from './plugin/display/default-display.js';
export type { DisplayOptions, HandlerType } from './plugin/display/default-display.js';

// Handlers
export { HandlerBase } from './plugin/handler/handler-base.js';
export type { HandlerOptions } from './plugin/handler/handler-base.js';
export { StandardField } from './plugin/handler/field-handler.js';
export { StandardFilter } from './plugin/handler/filter-handler.js';
export { StandardSort } from './plugin/handler/sort-handler.js';

// Access
export { PermissionAccess } from './plugin/access/permission-access.js';

// Permissions / routes
export { viewsPermissions } from './permissions.js';
export { viewsRoutes } from './routes.js';

// Hooks
export { viewsHelp, registerViewsHooks, VIEWS_MODULE } from './hooks.js';

// Shared local contracts
export {
  AccessResult,
  type AccessVerdict,
  type AccountInterface,
  type PermissionDefinition,
  type PermissionMap,
  type RouteDefinition,
  type RouteCollection,
} from './contracts.js';
