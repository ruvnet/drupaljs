/**
 * Local contracts for the user module.
 *
 * These mirror the relevant surface of Drupal core's Session/Entity contracts
 * (`Drupal\Core\Session\AccountInterface`, `Drupal\Core\Entity\*`). The shared
 * @drupaljs packages that will own these contracts are not implemented yet, so
 * we define minimal local types here.
 *
 * TODO(@drupaljs/contracts): replace `AccountInterface`, `RoleInterface`, and
 * `UserInterface` with the shared contracts once the entity / session packages
 * land. TODO(@drupaljs/entity): replace the config/content entity shape.
 */

/** Well-known role IDs. Ports AccountInterface::ANONYMOUS_ROLE / AUTHENTICATED_ROLE. */
export const ANONYMOUS_ROLE = 'anonymous';
export const AUTHENTICATED_ROLE = 'authenticated';

/** Maximum length of a username field. Ports UserInterface::USERNAME_MAX_LENGTH. */
export const USERNAME_MAX_LENGTH = 60;

/** Anonymous user id. */
export const ANONYMOUS_UID = 0;

/**
 * Account session contract.
 *
 * Ports the read surface of `Drupal\Core\Session\AccountInterface` needed by
 * the permission checker and access logic.
 */
export interface AccountInterface {
  /** The user id. 0 is the anonymous user. */
  id(): number;
  /** Returns role IDs granted to the account (locked roles included). */
  getRoles(excludeLockedRoles?: boolean): string[];
  /** True if the account has the given permission. */
  hasPermission(permission: string): boolean;
  /** True when the account is the anonymous user (uid 0). */
  isAnonymous(): boolean;
  /** True when the account is authenticated (uid > 0). */
  isAuthenticated(): boolean;
}

/**
 * Resolves the permissions granted to an account by aggregating its roles.
 *
 * Ports `Drupal\Core\Session\PermissionCheckerInterface`. In core the real
 * check runs through the AccessPolicyProcessor; here we aggregate role
 * permissions directly via a {@link RoleProviderInterface}.
 */
export interface PermissionCheckerInterface {
  hasPermission(permission: string, account: AccountInterface): boolean;
}

/**
 * Loads role entities by ID. Ports the slice of RoleStorage the permission
 * checker depends on.
 *
 * TODO(@drupaljs/entity): replace with EntityStorageInterface<Role>.
 */
export interface RoleProviderInterface {
  /** Returns the role with the given ID, or undefined if it does not exist. */
  getRole(rid: string): RoleInterface | undefined;
}

/**
 * User role config entity contract.
 *
 * Ports `Drupal\user\RoleInterface`.
 */
export interface RoleInterface {
  id(): string;
  label(): string;
  getWeight(): number;
  setWeight(weight: number): this;
  getPermissions(): string[];
  hasPermission(permission: string): boolean;
  grantPermission(permission: string): this;
  revokePermission(permission: string): this;
  isAdmin(): boolean;
  setIsAdmin(isAdmin: boolean): this;
}

/**
 * User content entity contract.
 *
 * Ports the core slice of `Drupal\user\UserInterface`.
 */
export interface UserInterface extends AccountInterface {
  getAccountName(): string;
  setUsername(name: string): this;
  getEmail(): string | null;
  setEmail(mail: string): this;
  getPassword(): string | null;
  setPassword(password: string): this;
  addRole(rid: string): this;
  removeRole(rid: string): this;
  hasRole(rid: string): boolean;
  isActive(): boolean;
  isBlocked(): boolean;
  activate(): this;
  block(): this;
}
