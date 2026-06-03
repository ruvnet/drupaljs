/**
 * @drupaljs/module-toolbar — TypeScript port of Drupal core's `toolbar` module.
 *
 * Ports a faithful vertical slice of `core/modules/toolbar`:
 * - permissions (`access toolbar`) — `toolbar.permissions.yml`
 * - routes (`toolbar.subtrees`) — `toolbar.routing.yml`
 * - the `toolbar` and `toolbar_item` render elements
 * - the `ToolbarController` route/access/pre-render handlers
 * - the `SetSubtreesCommand` AJAX command
 * - the `AllowToolbarPath` page-cache request policy
 * - hook implementations (`help`, `page_top`, `toolbar`) wired through
 *   `@drupaljs/hook`
 *
 * Deep external dependencies (render API, AJAX framework, menu tree, breakpoint
 * manager, session/account API, Claro-theme integration) are modelled with
 * minimal LOCAL contracts marked `TODO(@drupaljs/*)` until the owning packages
 * ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// Render elements.
export { Toolbar } from './Element/Toolbar.js';
export { ToolbarItem } from './Element/ToolbarItem.js';

// Controller.
export { ToolbarController } from './Controller/ToolbarController.js';
export type {
  ToolbarControllerDeps,
  ToolbarAjaxResponse,
  MenuTreeLike,
  MenuTreeParameters,
} from './Controller/ToolbarController.js';

// AJAX command.
export { SetSubtreesCommand } from './Ajax/SetSubtreesCommand.js';

// Page-cache request policy.
export { AllowToolbarPath } from './PageCache/AllowToolbarPath.js';

// Hooks + registration.
export { ToolbarHooks } from './Hook/ToolbarHooks.js';
export type { ToolbarHooksDeps } from './Hook/ToolbarHooks.js';
export { registerToolbarHooks, MODULE_NAME } from './Hook/register.js';
