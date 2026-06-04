/**
 * @drupaljs/module-views_ui — TypeScript port of Drupal core's `views_ui` module.
 *
 * Ports a faithful vertical slice of `core/modules/views_ui`:
 * - permissions (`administer views`)
 * - routes (from `views_ui.routing.yml`)
 * - the `ViewListBuilder` (enabled/disabled partitioning, display list, ops)
 * - the `ViewsUIController` route handlers (ajaxOperation, autocompleteTag)
 * - hook implementations (`help`, `entity_type_build`,
 *   `views_plugins_display_alter`, `contextual_links_view_alter`,
 *   `entity_operation`) wired through `@drupaljs/hook`.
 *
 * Deep external dependencies (forms, the Views handler/data subsystem, the full
 * entity + render APIs) are modelled with minimal LOCAL contracts marked with
 * `TODO(@drupaljs/*)` until the owning packages ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// List builder.
export { ViewListBuilder } from './ViewListBuilder.js';
export type { PartitionedViews } from './ViewListBuilder.js';

// Controller.
export { ViewsUIController, explodeTags } from './Controller/ViewsUIController.js';
export type {
  TagMatch,
  OperableView,
  AjaxOperationResult,
} from './Controller/ViewsUIController.js';

// Hooks + registration.
export { ViewsUiHooks } from './Hook/ViewsUiHooks.js';
export type {
  EntityTypeBuildTarget,
  DisplayPluginDefinition,
  ViewAccessChecker,
} from './Hook/ViewsUiHooks.js';
export { registerViewsUiHooks, MODULE_NAME } from './Hook/register.js';
