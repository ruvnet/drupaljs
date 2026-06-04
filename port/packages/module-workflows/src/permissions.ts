/**
 * Port of `workflows.permissions.yml`.
 *
 * The workflows module declares a single static permission. Per-workflow access
 * decisions are handled by the access control handler / access check, not by
 * dynamic permissions.
 */

export interface PermissionDescriptor {
  readonly title: string;
  readonly description?: string;
  /** Whether granting this permission is security-sensitive. */
  readonly 'restrict access'?: boolean;
}

export type PermissionSet = Record<string, PermissionDescriptor>;

export const workflowsPermissions: PermissionSet = {
  'administer workflows': {
    title: 'Administer workflows',
    description: 'Create and edit workflows.',
    'restrict access': true,
  },
};
