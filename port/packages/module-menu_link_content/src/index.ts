/**
 * `@drupaljs/module-menu_link_content` — public API barrel.
 *
 * TypeScript port of Drupal 11 core's `menu_link_content` module
 * (core/modules/menu_link_content). Provides the content menu-link entity, its
 * runtime menu-link plugin, access control handler, rediscovery deriver, hook
 * implementations (registered via `@drupaljs/hook`), routes and permissions.
 *
 * This is a faithful but minimal vertical slice; deep collaborators (entity
 * storage, menu link manager, access manager) are modelled as local contracts
 * in `./types` with TODO markers until the corresponding `@drupaljs/*` packages
 * land.
 */

// Entity
export {
  MenuLinkContent,
  menuLinkContentEntityType,
  linkFieldSettings,
  DEFAULT_MENU_NAME,
  MENU_LINK_CONTENT_PLUGIN_CLASS,
  MENU_LINK_CONTENT_FORM_CLASS,
} from './entity.js';
export type { MenuLinkContentValues } from './entity.js';

// Menu link plugin
export { MenuLinkContentPlugin } from './plugin-menu-link.js';
export type { MenuLinkContentPluginHandlers } from './plugin-menu-link.js';

// Access control
export { MenuLinkContentAccessControlHandler } from './access.js';
export type { MenuLinkContentOperation } from './access.js';

// Deriver
export { MenuLinkContentDeriver } from './deriver.js';

// Hooks
export {
  MenuLinkContentHooks,
  registerMenuLinkContentHooks,
  MODULE_NAME,
} from './hooks.js';
export type { MenuInterface, AlterableEntityType } from './hooks.js';

// Routes & permissions
export { menuLinkContentRoutes, menuLinkContentPermissions } from './routing.js';
export type { RouteDefinition } from './routing.js';

// Shared contracts
export type {
  MenuLinkPluginDefinition,
  MenuLinkManagerInterface,
  MenuLinkInstance,
  MenuLinkContentStorageInterface,
  EntityTypeManagerInterface,
  AccountInterface,
  AccessManagerInterface,
  AccessVerdict,
  LinkValue,
  LinkOptions,
} from './types.js';
