/**
 * Port of `book.permissions.yml`.
 *
 * The book module declares three static permissions. `create new books` and
 * `add content to books` gate placing nodes into the outline; `administer book
 * outlines` is the access-restricted permission for full outline management.
 */

/** A single permission descriptor, mirroring an entry in *.permissions.yml. */
export interface PermissionDefinition {
  title: string;
  description?: string;
  restrict_access?: boolean;
}

export type PermissionMap = Record<string, PermissionDefinition>;

/** Static book permissions. Faithful to book.permissions.yml. */
export function bookPermissions(): PermissionMap {
  return {
    'administer book outlines': {
      title: 'Administer book outlines',
      restrict_access: true,
    },
    'create new books': {
      title: 'Create new books',
    },
    'add content to books': {
      title: 'Add content and child pages to books',
    },
  };
}
