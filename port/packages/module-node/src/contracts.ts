/**
 * Local, minimal contracts the node module depends on from other Drupal
 * subsystems that are not yet ported. Each is a faithful but reduced surface of
 * the real Drupal interface; replace with the shared `@drupaljs/*` type when it
 * lands.
 */

/**
 * Minimal account/session surface used for access checks.
 *
 * TODO(@drupaljs/session): replace with the shared AccountInterface port of
 * `Drupal\Core\Session\AccountInterface`.
 */
export interface AccountInterface {
  /** The account's user id. Anonymous is 0. */
  id(): number;
  /** True if the account has the named permission. */
  hasPermission(permission: string): boolean;
  /** True for any non-anonymous (uid !== 0) account. */
  isAuthenticated(): boolean;
}

/**
 * Result of an access check. Ports the tri-state semantics of
 * `Drupal\Core\Access\AccessResultInterface`: allowed, forbidden, or neutral.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult port. The
 * `@drupaljs/access` package exists but is empty at time of writing.
 */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

/**
 * A minimal, immutable access result with the combinator semantics the node
 * access handler relies on (`andIf`, `orIf`). Ports the subset of
 * `Drupal\Core\Access\AccessResult` actually used here.
 */
export class AccessResult {
  private constructor(public readonly verdict: AccessVerdict) {}

  static allowed(): AccessResult {
    return new AccessResult('allowed');
  }

  static forbidden(): AccessResult {
    return new AccessResult('forbidden');
  }

  static neutral(): AccessResult {
    return new AccessResult('neutral');
  }

  /** allowed() when `condition` is true, neutral() otherwise. */
  static allowedIf(condition: boolean): AccessResult {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
  }

  /** True only for an explicitly allowed verdict. */
  isAllowed(): boolean {
    return this.verdict === 'allowed';
  }

  isForbidden(): boolean {
    return this.verdict === 'forbidden';
  }

  isNeutral(): boolean {
    return this.verdict === 'neutral';
  }

  /**
   * Combines two results with AND semantics (ports AccessResult::andIf):
   * forbidden wins over everything; otherwise both must be allowed.
   */
  andIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden();
    }
    if (this.isAllowed() && other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral();
  }

  /**
   * Combines two results with OR semantics (ports AccessResult::orIf):
   * forbidden still wins; otherwise allowed if either is allowed.
   */
  orIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden();
    }
    if (this.isAllowed() || other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral();
  }
}

/**
 * A single permission definition as exposed to the permissions system.
 * Ports the shape produced by `*.permissions.yml` / permission callbacks.
 */
export interface PermissionDefinition {
  title: string;
  description?: string;
  /** When true, the permission is security-sensitive. */
  restrict_access?: boolean;
}

/** A keyed map of permission machine name -> definition. */
export type PermissionMap = Record<string, PermissionDefinition>;

/**
 * Minimal route definition surface. Ports the relevant subset of a
 * `Symfony\Component\Routing\Route` as expressed in Drupal `*.routing.yml`.
 *
 * TODO(@drupaljs/routing): replace with the shared Route type.
 */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: Record<string, string>;
  options?: Record<string, unknown>;
}

/** A keyed map of route name -> definition. */
export type RouteCollection = Record<string, RouteDefinition>;
