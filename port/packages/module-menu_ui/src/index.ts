/**
 * @drupaljs/module-menu_ui — TypeScript port of Drupal core's `menu_ui` module.
 *
 * Ports a faithful vertical slice of `core/modules/menu_ui`:
 * - permissions (`administer menu`)
 * - routes (from `menu_ui.routing.yml`)
 * - the `MenuUiMenuTreeManipulators` service
 * - the `MenuController` route handlers
 * - hook implementations (`help`, `entity_type_build`,
 *   `block_view_system_menu_block_alter`) wired through `@drupaljs/hook`.
 *
 * Deep external dependencies (forms, full entity API, node integration) are
 * modelled with minimal LOCAL contracts marked with `TODO(@drupaljs/*)` until
 * the owning packages ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// Service: menu tree manipulator.
export { MenuUiMenuTreeManipulators } from './Menu/MenuUiMenuTreeManipulators.js';

// Controller.
export { MenuController } from './Controller/MenuController.js';

// Hooks + registration.
export { MenuUiHooks } from './Hook/MenuUiHooks.js';
export type { EntityTypeBuildTarget, BlockPluginLike } from './Hook/MenuUiHooks.js';
export { registerMenuUiHooks, MODULE_NAME } from './Hook/register.js';
