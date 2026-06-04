/**
 * Aggregates role permissions for an account.
 *
 * Ports `Drupal\Core\Session\PermissionChecker`. Core resolves permissions via
 * the AccessPolicyProcessor; this port performs the equivalent aggregation by
 * unioning the permissions of every role the account holds, resolving each role
 * ID through a {@link RoleProviderInterface}.
 */
import type {
  AccountInterface,
  PermissionCheckerInterface,
  RoleProviderInterface,
} from './types.js';

export class PermissionChecker implements PermissionCheckerInterface {
  constructor(private readonly roleProvider: RoleProviderInterface) {}

  hasPermission(permission: string, account: AccountInterface): boolean {
    for (const rid of account.getRoles()) {
      const role = this.roleProvider.getRole(rid);
      if (role !== undefined && role.hasPermission(permission)) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Simple in-memory role provider. Stands in for RoleStorage.
 *
 * TODO(@drupaljs/entity): replace with the config-entity storage once available.
 */
import type { RoleInterface } from './types.js';

export class InMemoryRoleProvider implements RoleProviderInterface {
  private readonly roles = new Map<string, RoleInterface>();

  constructor(roles: RoleInterface[] = []) {
    for (const role of roles) {
      this.addRole(role);
    }
  }

  addRole(role: RoleInterface): this {
    this.roles.set(role.id(), role);
    return this;
  }

  getRole(rid: string): RoleInterface | undefined {
    return this.roles.get(rid);
  }
}
