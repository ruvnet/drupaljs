/**
 * Port of `update.permissions.yml`.
 *
 * The update module declares a single static permission controlling who may see
 * software-update notifications.
 */

export interface PermissionDescriptor {
  readonly title: string;
  readonly description?: string;
  readonly 'restrict access'?: boolean;
}

export type PermissionSet = Record<string, PermissionDescriptor>;

export const updatePermissions: PermissionSet = {
  'view update notifications': {
    title: 'View software update notifications',
    description:
      'Ensure that site administrators have this permission so that security updates are applied promptly.',
  },
};
