/**
 * Local contracts (minimal stubs) for the `tour` module port.
 *
 * The tour module leans on several core subsystems that have not been ported
 * yet. Each is modelled here as a minimal LOCAL interface marked with a
 * `TODO(@drupaljs/*)` pointing at the package expected to eventually own it.
 * These keep the vertical slice self-contained and testable without pulling in
 * the entire core.
 */

// ---------------------------------------------------------------------------
// Access / current user
// ---------------------------------------------------------------------------

/**
 * Subset of `Drupal\Core\Session\AccountInterface`.
 *
 * TODO(@drupaljs/session): replace with the shared account interface.
 */
export interface AccountLike {
  /** Whether the account has the given permission string. */
  hasPermission(permission: string): boolean;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** A Drupal render array (loosely typed). */
export type RenderArray = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Route matching (tour appears on routes it is bound to)
// ---------------------------------------------------------------------------

/**
 * Subset of `Drupal\Core\Routing\RouteMatchInterface` used to decide which
 * tours apply to the current page.
 *
 * TODO(@drupaljs/routing): replace with the shared RouteMatch interface.
 */
export interface RouteMatchLike {
  /** Returns the current route name, or null when none matched. */
  getRouteName(): string | null;
}

// ---------------------------------------------------------------------------
// Config entity storage (tours are config entities)
// ---------------------------------------------------------------------------

/**
 * Subset of `Drupal\Core\Entity\EntityStorageInterface` for loading the tour
 * config entities. Only the surface the tour module uses is modelled.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityStorage interface.
 */
export interface TourStorageLike {
  /** Loads all tour entities keyed by id. */
  loadMultiple(): Record<string, import('./Entity/Tour.js').Tour>;
}
