/**
 * Local, minimal contracts the search module depends on from other Drupal
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
 * A minimal, immutable access result with the combinator semantics the search
 * access handler relies on. Ports the subset of `Drupal\Core\Access\AccessResult`
 * actually used here.
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

  /** allowedIf the account has the named permission. */
  static allowedIfHasPermission(account: AccountInterface, permission: string): AccessResult {
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
 * An object that can answer its own access checks. Ports
 * `Drupal\Core\Access\AccessibleInterface` (reduced).
 */
export interface AccessibleInterface {
  access(operation: string, account: AccountInterface): AccessResult;
}

/**
 * A single permission definition as exposed to the permissions system.
 * Ports the shape produced by `*.permissions.yml`.
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

/**
 * Minimal config-factory surface used by the repository / text processor.
 *
 * TODO(@drupaljs/config): replace with the shared ConfigFactory port of
 * `Drupal\Core\Config\ConfigFactoryInterface`.
 */
export interface ConfigInterface {
  get(key: string): unknown;
  set(key: string, value: unknown): ConfigInterface;
  clear(key: string): ConfigInterface;
  save(): void;
}

export interface ConfigFactoryInterface {
  get(name: string): ConfigInterface;
  getEditable(name: string): ConfigInterface;
}

/**
 * Minimal hook-registration surface satisfied by `@drupaljs/hook`'s
 * ModuleHandler. Only the members the search hooks use are modelled.
 *
 * TODO(@drupaljs/hook): import ModuleHandlerInterface directly once a stable
 * cross-package dependency is wired in the workspace.
 */
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: unknown[]) => unknown): void;
  invokeAllWith(
    hook: string,
    callback: (listener: (...args: unknown[]) => unknown, module: string) => void,
  ): void;
}
