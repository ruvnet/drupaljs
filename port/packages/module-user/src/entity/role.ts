/**
 * Role config entity. Ports `Drupal\user\Entity\Role`.
 *
 * Reference: drupal-core/core/modules/user/src/Entity/Role.php
 */
import {
  ANONYMOUS_ROLE,
  AUTHENTICATED_ROLE,
  type RoleInterface,
} from '../types.js';

export interface RoleValues {
  id: string;
  label?: string;
  weight?: number;
  permissions?: string[];
  is_admin?: boolean;
}

export class Role implements RoleInterface {
  /** Role ID for anonymous users. Ports RoleInterface::ANONYMOUS_ID. */
  static readonly ANONYMOUS_ID = ANONYMOUS_ROLE;
  /** Role ID for authenticated users. Ports RoleInterface::AUTHENTICATED_ID. */
  static readonly AUTHENTICATED_ID = AUTHENTICATED_ROLE;

  private readonly _id: string;
  private _label: string;
  private _weight: number;
  private _permissions: string[];
  private _isAdmin: boolean;

  constructor(values: RoleValues) {
    this._id = values.id;
    this._label = values.label ?? values.id;
    this._weight = values.weight ?? 0;
    // De-duplicate to match config-entity semantics.
    this._permissions = [...new Set(values.permissions ?? [])];
    this._isAdmin = values.is_admin ?? false;
  }

  id(): string {
    return this._id;
  }

  label(): string {
    return this._label;
  }

  getWeight(): number {
    return this._weight;
  }

  setWeight(weight: number): this {
    this._weight = weight;
    return this;
  }

  /**
   * Admin roles never report explicit permissions: they implicitly have all.
   * Ports Role::getPermissions().
   */
  getPermissions(): string[] {
    if (this.isAdmin()) {
      return [];
    }
    return [...this._permissions];
  }

  hasPermission(permission: string): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return this._permissions.includes(permission);
  }

  grantPermission(permission: string): this {
    if (this.isAdmin()) {
      return this;
    }
    if (!this.hasPermission(permission)) {
      this._permissions.push(permission);
    }
    return this;
  }

  revokePermission(permission: string): this {
    if (this.isAdmin()) {
      return this;
    }
    this._permissions = this._permissions.filter((p) => p !== permission);
    return this;
  }

  isAdmin(): boolean {
    return this._isAdmin;
  }

  setIsAdmin(isAdmin: boolean): this {
    this._isAdmin = isAdmin;
    return this;
  }
}
