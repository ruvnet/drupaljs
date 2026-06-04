/**
 * @drupaljs/module-block_content — TypeScript port of Drupal core's
 * `block_content` module.
 *
 * Faithful but minimal vertical slice of the module's behaviour-bearing core:
 *
 * - Entities: {@link BlockContent} (content block) and {@link BlockContentType}
 *   (config bundle), ported from `src/Entity/*`.
 * - Permissions: static + dynamic per-type, from `BlockContentPermissions` and
 *   `block_content.permissions.yml`.
 * - Access: {@link BlockContentIsReusableAccessCheck} (`_block_content_reusable`).
 * - Hooks: `hook_theme` and `hook_entity_type_alter`, registered against
 *   `@drupaljs/hook`'s ModuleHandler (PHP `#[Hook]` → explicit `implement()`).
 * - Routes: the statically declared `block_content.routing.yml` routes.
 *
 * Deep collaborators (block plugin storage, field/typed-data, full routing) are
 * stubbed with local types in `./types` and injected, marked TODO.
 *
 * @see drupal-core/core/modules/block_content
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { registerHooks } from './hooks.js';

// Entities
export {
  BlockContent,
  BLOCK_CONTENT_ENTITY_KEYS,
  BLOCK_CONTENT_BASE_FIELDS,
  type BlockContentValues,
  type InstanceLoader,
} from './block-content.js';
export {
  BlockContentType,
  BLOCK_CONTENT_TYPE_ENTITY_TYPE,
  BLOCK_CONTENT_ENTITY_TYPE,
  BLOCK_CONTENT_TYPE_CONFIG_EXPORT,
  type BlockContentTypeValues,
} from './block-content-type.js';

// Permissions
export {
  STATIC_PERMISSIONS,
  buildPermissions,
  blockTypePermissions,
  allPermissions,
} from './permissions.js';

// Access
export {
  BlockContentIsReusableAccessCheck,
  type RouteMatch,
} from './access-reusable.js';

// Hooks
export {
  theme,
  entityTypeAlter,
  registerHooks,
  MODULE_NAME,
  type AlterableEntityType,
} from './hooks.js';

// Routes
export { ROUTES, getRoutes } from './routes.js';

// Shared local stubs (re-exported for consumers of the public contract).
export {
  AccessResult,
  t,
  type AccessResultInterface,
  type AccessVerdict,
  type PermissionDefinition,
  type PermissionSet,
  type RouteDefinition,
  type RouteCollection,
} from './types.js';

/**
 * Installs the module: registers its hook implementations against the shared
 * ModuleHandler. The TS-idiomatic equivalent of Drupal's install/bootstrap
 * wiring of `#[Hook]` discovery.
 */
export function installBlockContentModule(moduleHandler: ModuleHandlerInterface): void {
  registerHooks(moduleHandler);
}
