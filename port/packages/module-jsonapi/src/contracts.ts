/**
 * Local, minimal contracts the jsonapi module depends on from other Drupal
 * subsystems that are not yet ported. Each is a faithful but reduced surface of
 * the real Drupal interface; replace with the shared `@drupaljs/*` type when it
 * lands.
 */

/**
 * Tri-state access result. Ports the semantics of
 * `Drupal\Core\Access\AccessResultInterface`: allowed, forbidden, or neutral.
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult port. The
 * `@drupaljs/access` package exists but is empty at time of writing.
 */
export type AccessVerdict = 'allowed' | 'forbidden' | 'neutral';

/**
 * A minimal, immutable access result with the combinator semantics the jsonapi
 * filter-access hooks rely on. Ports the subset of
 * `Drupal\Core\Access\AccessResult` actually used here (allowed / forbidden /
 * neutral + allowedIfHasPermission factory).
 *
 * TODO(@drupaljs/access): replace with the shared AccessResult port.
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

  /**
   * allowed() if the account holds the permission, neutral() otherwise.
   * Ports `AccessResult::allowedIfHasPermission`.
   */
  static allowedIfHasPermission(
    account: AccountInterface,
    permission: string,
  ): AccessResult {
    return AccessResult.allowedIf(account.hasPermission(permission));
  }

  isAllowed(): boolean {
    return this.verdict === 'allowed';
  }

  isForbidden(): boolean {
    return this.verdict === 'forbidden';
  }

  isNeutral(): boolean {
    return this.verdict === 'neutral';
  }
}

/**
 * Minimal account/session surface used for filter-access checks.
 *
 * TODO(@drupaljs/session): replace with the shared AccountInterface port of
 * `Drupal\Core\Session\AccountInterface`.
 */
export interface AccountInterface {
  /** The account's user id. Anonymous is 0. */
  id(): number;
  /** True if the account has the named permission. */
  hasPermission(permission: string): boolean;
}

/**
 * Minimal entity-type surface used by the filter-access hooks. Ports the small
 * subset of `Drupal\Core\Entity\EntityTypeInterface` actually consulted here.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityType port.
 */
export interface EntityTypeInterface {
  /** The entity type machine id, e.g. "node". */
  id(): string;
  /**
   * The administrative permission for this entity type, or null when none is
   * declared. Ports `EntityTypeInterface::getAdminPermission()`.
   */
  getAdminPermission(): string | null;
}

/**
 * A single permission definition as exposed to the permissions system.
 * Ports the shape produced by `*.permissions.yml` / permission callbacks.
 *
 * The jsonapi module declares no permissions of its own, but the type is shared
 * here for consistency with sibling module packages.
 */
export interface PermissionDefinition {
  title: string;
  description?: string;
  restrict_access?: boolean;
}

/** A keyed map of permission machine name -> definition. */
export type PermissionMap = Record<string, PermissionDefinition>;

/**
 * Minimal route definition surface. Ports the relevant subset of a
 * `Symfony\Component\Routing\Route` as expressed in Drupal `*.routing.yml` and
 * as produced by `Routes::routes()`.
 *
 * TODO(@drupaljs/routing): replace with the shared Route type.
 */
export interface RouteDefinition {
  path: string;
  /** Allowed HTTP methods, e.g. ['GET']. */
  methods?: string[];
  defaults?: Record<string, unknown>;
  requirements?: Record<string, string>;
  options?: Record<string, unknown>;
}

/** A keyed map of route name -> definition. */
export type RouteCollection = Record<string, RouteDefinition>;
