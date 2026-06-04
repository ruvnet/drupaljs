/**
 * User content entity. Ports `Drupal\user\Entity\User`.
 *
 * Reference: drupal-core/core/modules/user/src/Entity/User.php
 *
 * The real entity delegates permission checks to the `permission_checker`
 * service; we keep that injection point as an optional collaborator so callers
 * can wire a {@link PermissionCheckerInterface} (London-style mock-friendly).
 */
import { Role } from './role.js';
import {
  ANONYMOUS_UID,
  AUTHENTICATED_ROLE,
  ANONYMOUS_ROLE,
  type PermissionCheckerInterface,
  type UserInterface,
} from '../types.js';

export interface UserValues {
  uid?: number;
  name?: string;
  mail?: string | null;
  pass?: string | null;
  /** 1 = active, 0 = blocked. Defaults to active for authenticated users. */
  status?: 0 | 1;
  /** Non-locked role IDs assigned to the user. */
  roles?: string[];
}

const LOCKED_ROLES = new Set<string>([AUTHENTICATED_ROLE, ANONYMOUS_ROLE]);

export class User implements UserInterface {
  private readonly _uid: number;
  private _name: string;
  private _mail: string | null;
  private _pass: string | null;
  private _status: 0 | 1;
  /** Explicitly-assigned (non-locked) roles. */
  private _roles: string[];

  constructor(
    values: UserValues = {},
    private readonly permissionChecker?: PermissionCheckerInterface,
  ) {
    this._uid = values.uid ?? ANONYMOUS_UID;
    this._name = values.name ?? '';
    this._mail = values.mail ?? null;
    this._pass = values.pass ?? null;
    this._status = values.status ?? 1;
    this._roles = [...new Set(values.roles ?? [])];
  }

  id(): number {
    return this._uid;
  }

  isAnonymous(): boolean {
    return this._uid === ANONYMOUS_UID;
  }

  isAuthenticated(): boolean {
    return this._uid > ANONYMOUS_UID;
  }

  /**
   * Returns role IDs. The locked anonymous/authenticated role is prepended
   * based on the account's authentication state. Ports User::getRoles().
   */
  getRoles(excludeLockedRoles = false): string[] {
    const roles: string[] = [];
    if (!excludeLockedRoles) {
      roles.push(this.isAuthenticated() ? AUTHENTICATED_ROLE : ANONYMOUS_ROLE);
    }
    for (const rid of this._roles) {
      roles.push(rid);
    }
    return roles;
  }

  hasRole(rid: string): boolean {
    return this.getRoles().includes(rid);
  }

  /**
   * Assigns a role. The locked roles must never be assigned manually.
   * Ports User::addRole().
   */
  addRole(rid: string): this {
    if (LOCKED_ROLES.has(rid)) {
      throw new Error(
        'Anonymous or authenticated role ID must not be assigned manually.',
      );
    }
    if (!this._roles.includes(rid)) {
      this._roles.push(rid);
    }
    return this;
  }

  removeRole(rid: string): this {
    this._roles = this._roles.filter((r) => r !== rid);
    return this;
  }

  /**
   * Delegates to the injected permission checker. Ports User::hasPermission(),
   * which calls the `permission_checker` service.
   */
  hasPermission(permission: string): boolean {
    if (this.permissionChecker === undefined) {
      throw new Error(
        'User.hasPermission() requires a PermissionChecker collaborator.',
      );
    }
    return this.permissionChecker.hasPermission(permission, this);
  }

  getAccountName(): string {
    return this._name;
  }

  setUsername(name: string): this {
    this._name = name;
    return this;
  }

  getEmail(): string | null {
    return this._mail;
  }

  setEmail(mail: string): this {
    this._mail = mail;
    return this;
  }

  getPassword(): string | null {
    return this._pass;
  }

  setPassword(password: string): this {
    this._pass = password;
    return this;
  }

  isActive(): boolean {
    return this._status === 1;
  }

  isBlocked(): boolean {
    return this._status === 0;
  }

  /** Activates the account. The anonymous user must stay blocked. */
  activate(): this {
    if (this.isAnonymous()) {
      throw new Error(
        'The anonymous user account should remain blocked at all times.',
      );
    }
    this._status = 1;
    return this;
  }

  block(): this {
    this._status = 0;
    return this;
  }
}

// Re-export for convenience so callers can `new Role()` alongside `new User()`.
export { Role };
