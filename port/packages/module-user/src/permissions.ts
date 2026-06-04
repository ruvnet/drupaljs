/**
 * Permissions defined by the user module.
 *
 * Ports drupal-core/core/modules/user/user.permissions.yml. The
 * {@link PermissionHandler} models the slice of
 * `Drupal\user\PermissionHandlerInterface` that returns the module's defined
 * permissions (without the YAML / hook_permission discovery machinery).
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  readonly title: string;
  /** Optional longer description. */
  readonly description?: string;
  /** When true, only trusted roles should be granted this permission. */
  readonly restrictAccess?: boolean;
}

/** The static permission map ported verbatim from user.permissions.yml. */
export const USER_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> =
  Object.freeze({
    'administer permissions': {
      title: 'Administer roles and permissions',
      restrictAccess: true,
    },
    'administer account settings': {
      title: 'Administer account settings',
      description:
        'Configure site-wide settings and behavior for user accounts and registration.',
      restrictAccess: true,
    },
    'administer users': {
      title: 'Administer users',
      description: 'Manage all user accounts.',
      restrictAccess: true,
    },
    'access user profiles': {
      title: 'View user information',
    },
    'view user email addresses': {
      title: 'View user email addresses',
    },
    'change own username': {
      title: 'Change own username',
    },
    'select account cancellation method': {
      title: 'Select method for cancelling account',
      restrictAccess: true,
    },
    'cancel account': {
      title: 'Cancel own user account',
    },
  });

/**
 * Provides the permissions defined by the user module.
 *
 * Ports the relevant slice of `Drupal\user\PermissionHandler`.
 */
export class PermissionHandler {
  constructor(
    private readonly permissions: Readonly<
      Record<string, PermissionDefinition>
    > = USER_PERMISSIONS,
  ) {}

  /** Returns all defined permissions keyed by machine name. */
  getPermissions(): Record<string, PermissionDefinition> {
    return { ...this.permissions };
  }

  /** Returns the list of defined permission machine names. */
  getPermissionNames(): string[] {
    return Object.keys(this.permissions);
  }

  /** True if the given permission is defined by this module. */
  permissionExists(permission: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.permissions, permission);
  }
}
