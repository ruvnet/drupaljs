/**
 * File module permissions.
 *
 * Ports drupal-core/core/modules/file/file.permissions.yml.
 */

export interface PermissionDefinition {
  /** Human-readable permission title. */
  title: string;
  /** Marks dangerous permissions (Drupal `restrict access: true`). */
  restrictAccess?: boolean;
}

/** Keyed by the permission machine name, preserving the YAML declaration order. */
export const filePermissions: Record<string, PermissionDefinition> = {
  'access files overview': { title: 'Access the Files overview page' },
  'delete own files': { title: 'Delete own files' },
  'delete any file': { title: 'Delete any file', restrictAccess: true },
};
