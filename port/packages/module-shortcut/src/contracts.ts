/**
 * Local contracts for `@drupaljs/module-shortcut`.
 *
 * The shortcut module sits on top of several core subsystems that are still
 * scaffolds in this port (entity API, config-entity API, render API, the
 * account/session API, URLs, cache invalidation, database). Rather than block on
 * them, this module models the minimal surface it actually touches as LOCAL
 * types, each marked with a `TODO(@drupaljs/*)` pointing at the package that will
 * eventually own it.
 */

// ---------------------------------------------------------------------------
// Account / session
// ---------------------------------------------------------------------------

/**
 * The minimal slice of `Drupal\Core\Session\AccountInterface` shortcut uses:
 * an id plus permission checks.
 *
 * TODO(@drupaljs/session): replace with the shared AccountInterface.
 */
export interface AccountInterface {
  id(): string | number;
  hasPermission(permission: string): boolean;
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Minimal URL value, ported from `Drupal\Core\Url`. Shortcut only needs to carry
 * a route name + parameters to its link field.
 *
 * TODO(@drupaljs/routing): replace with the shared Url value object.
 */
export interface UrlLike {
  route: string;
  parameters?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Access result
// ---------------------------------------------------------------------------

/**
 * Minimal access result, ported from `Drupal\Core\Access\AccessResult`. Carries
 * the allowed/forbidden/neutral verdict plus an optional reason; the cacheable
 * metadata of the original is out of scope for this slice.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult value object.
 */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

export interface AccessResult {
  verdict: AccessVerdict;
  /** Convenience: true only for an explicit `allowed` verdict. */
  isAllowed(): boolean;
  /** Optional human-readable reason a result is not allowed. */
  reason?: string;
}

export function accessAllowed(): AccessResult {
  return { verdict: 'allowed', isAllowed: () => true };
}

export function accessNeutral(reason?: string): AccessResult {
  const result: AccessResult = { verdict: 'neutral', isAllowed: () => false };
  if (reason !== undefined) {
    result.reason = reason;
  }
  return result;
}

export function accessAllowedIf(condition: boolean, reason?: string): AccessResult {
  return condition ? accessAllowed() : accessNeutral(reason);
}

// ---------------------------------------------------------------------------
// Render API
// ---------------------------------------------------------------------------

/**
 * A Drupal render array. Faithfully a recursive associative array mixing
 * `#`-prefixed properties with child render arrays keyed by string.
 *
 * TODO(@drupaljs/render): replace with the shared RenderArray type once the
 * render package ships.
 */
export interface RenderArray {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module handler (subset)
// ---------------------------------------------------------------------------

/**
 * The subset of `@drupaljs/hook`'s `ModuleHandlerInterface` the shortcut module
 * needs at runtime: checking enabled modules and invoking the
 * `hook_shortcut_default_set` collector.
 *
 * Defined locally (structurally compatible with the real interface) so services
 * can be unit-tested with a tiny mock.
 */
export interface ShortcutModuleHandler {
  moduleExists(module: string): boolean;
  invokeAll(hook: string, args?: unknown[]): unknown;
}
