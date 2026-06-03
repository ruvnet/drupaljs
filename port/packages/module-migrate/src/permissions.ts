/**
 * Port of `migrate.permissions.yml`.
 */

import type { PermissionMap } from './contracts.js';

export function migratePermissions(): PermissionMap {
  return {
    'view migration messages': {
      title: 'View migration messages',
    },
  };
}
