/**
 * @drupaljs/module-shortcut — TypeScript port of Drupal core's `shortcut` module.
 *
 * Ports a faithful vertical slice of `core/modules/shortcut`:
 * - the `shortcut` content entity and `shortcut_set` config (bundle) entity
 *   (`src/Entity/*`)
 * - the `shortcut_set` storage with its unique user-assignment / default-set
 *   resolution (`ShortcutSetStorage`)
 * - the `shortcut_set_edit_access` / `shortcut_set_switch_access` callbacks
 *   (`ShortcutAccess`) and the entity `ShortcutAccessControlHandler`
 * - permissions (`shortcut.permissions.yml`) and routes (`shortcut.routing.yml`)
 * - hook implementations (`help`, `toolbar`, `user_delete`) wired through
 *   `@drupaljs/hook`
 *
 * Deep external dependencies (entity/field API, config-entity API, render & AJAX
 * frameworks, database, URL/routing, cache invalidation, session/account API)
 * are modelled with minimal LOCAL contracts marked `TODO(@drupaljs/*)` until the
 * owning packages ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// Entity interfaces & classes.
export type { ShortcutInterface, ShortcutSetInterface } from './Entity/interfaces.js';
export { Shortcut, strnatcasecmp } from './Entity/Shortcut.js';
export type { ShortcutValues } from './Entity/Shortcut.js';
export { ShortcutSet } from './Entity/ShortcutSet.js';
export type { ShortcutSetValues } from './Entity/ShortcutSet.js';

// Storage.
export { ShortcutSetStorage } from './ShortcutSetStorage.js';
export type {
  ShortcutSetStorageInterface,
  ShortcutSetStorageDeps,
  ShortcutEntityStorageInterface,
} from './ShortcutSetStorage.js';

// Access.
export { ShortcutAccess } from './ShortcutAccess.js';
export { ShortcutAccessControlHandler } from './ShortcutAccessControlHandler.js';

// Hooks + registration.
export { ShortcutHooks } from './Hook/ShortcutHooks.js';
export type { ShortcutHooksDeps } from './Hook/ShortcutHooks.js';
export { registerShortcutHooks, MODULE_NAME } from './Hook/register.js';
