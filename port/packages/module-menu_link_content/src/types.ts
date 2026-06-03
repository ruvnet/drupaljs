/**
 * Local contracts for `@drupaljs/module-menu_link_content`.
 *
 * These model the slice of the Drupal core entity / menu-link subsystem that the
 * menu_link_content module collaborates with. They stand in for shared
 * `@drupaljs/*` contracts that do not yet exist; replace them with the real
 * packages as they land (TODO markers below).
 */

import type { LinkOptions, LinkValue } from '@drupaljs/link';

// ---------------------------------------------------------------------------
// Menu link plugin definition
// ---------------------------------------------------------------------------

/**
 * The plugin definition produced from a menu_link_content entity and consumed by
 * the menu link manager. Mirrors the array built by
 * `MenuLinkContentInterface::getPluginDefinition()`.
 */
export interface MenuLinkPluginDefinition {
  /** Fully-qualified plugin class (kept as a string to match Drupal). */
  class: string;
  menu_name: string;
  /** Unrouted external/internal URI, or null when routed. */
  url: string | null;
  /** Route name when routed, or null when an unrouted URI is used. */
  route_name: string | null;
  route_parameters: Record<string, unknown>;
  options: LinkOptions;
  title: string;
  description: string;
  weight: number;
  id: string;
  metadata: { entity_id?: string | number | null };
  form_class: string;
  enabled: 0 | 1;
  expanded: 0 | 1;
  provider: string;
  discovered: 0 | 1;
  parent: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Menu link manager (collaborator)
// ---------------------------------------------------------------------------

/**
 * A live menu link plugin instance, as returned by
 * `MenuLinkManagerInterface::loadLinksByRoute()`.
 *
 * TODO(@drupaljs/menu): replace with the shared MenuLinkInterface once the menu
 * subsystem package is ported.
 */
export interface MenuLinkInstance {
  isDeletable(): boolean;
  deleteLink(): void;
}

/**
 * The minimal surface of `Drupal\Core\Menu\MenuLinkManagerInterface` that this
 * module depends on (definition CRUD + route lookup).
 *
 * TODO(@drupaljs/menu): replace with the shared MenuLinkManagerInterface.
 */
export interface MenuLinkManagerInterface {
  /** Returns a definition by plugin ID, or undefined when missing. */
  getDefinition(pluginId: string, exceptionOnInvalid?: boolean): MenuLinkPluginDefinition | undefined;
  addDefinition(pluginId: string, definition: MenuLinkPluginDefinition): MenuLinkPluginDefinition;
  updateDefinition(
    pluginId: string,
    definition: Partial<MenuLinkPluginDefinition>,
    persist?: boolean,
  ): MenuLinkPluginDefinition;
  removeDefinition(pluginId: string, persist?: boolean): void;
  loadLinksByRoute(
    routeName: string,
    routeParameters?: Record<string, unknown>,
  ): Record<string, MenuLinkInstance>;
}

// ---------------------------------------------------------------------------
// Entity storage (collaborator)
// ---------------------------------------------------------------------------

/**
 * The slice of `EntityStorageInterface` the module uses for menu_link_content.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityStorageInterface.
 */
export interface MenuLinkContentStorageInterface {
  loadMultiple(ids?: Array<string | number>): Record<string, MenuLinkContentEntity>;
  loadByProperties(properties: Record<string, unknown>): MenuLinkContentEntity[];
  delete(entities: MenuLinkContentEntity[]): void;
}

/**
 * The slice of `EntityTypeManagerInterface` the module uses.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityTypeManagerInterface.
 */
export interface EntityTypeManagerInterface {
  getStorage(entityTypeId: string): MenuLinkContentStorageInterface;
}

// ---------------------------------------------------------------------------
// Access (collaborator)
// ---------------------------------------------------------------------------

/**
 * The slice of `AccountInterface` used for permission checks.
 *
 * TODO(@drupaljs/access): replace with the shared AccountInterface.
 */
export interface AccountInterface {
  hasPermission(permission: string): boolean;
}

/**
 * Route access checker, mirroring `AccessManagerInterface::checkNamedRoute()`.
 *
 * TODO(@drupaljs/access): replace with the shared AccessManagerInterface.
 */
export interface AccessManagerInterface {
  checkNamedRoute(
    routeName: string,
    routeParameters: Record<string, unknown>,
    account: AccountInterface,
  ): boolean;
}

/**
 * Result of an access check. Mirrors the boolean verdict of
 * `Drupal\Core\Access\AccessResult` (cacheability metadata is out of scope for
 * this slice).
 */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

// ---------------------------------------------------------------------------
// Field input
// ---------------------------------------------------------------------------

/** Re-export the link field value shape this module stores under `link`. */
export type { LinkValue, LinkOptions };
