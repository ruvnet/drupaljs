/**
 * Port of `Drupal\block_content\BlockContentPermissions` plus the static
 * permissions from `block_content.permissions.yml`.
 *
 * The static set is fixed; the dynamic set is generated per block type via the
 * `permission_callbacks` mechanism (BlockContentPermissions::blockTypePermissions).
 *
 * @see drupal-core/core/modules/block_content/src/BlockContentPermissions.php
 * @see drupal-core/core/modules/block_content/block_content.permissions.yml
 */

import type { BlockContentType } from './block-content-type.js';
import { t, type PermissionSet } from './types.js';

/** The static permissions declared directly in block_content.permissions.yml. */
export const STATIC_PERMISSIONS: PermissionSet = {
  'access block library': {
    title: 'Access the Content blocks overview page',
    description: 'Get an overview of all content blocks.',
  },
  'administer block types': {
    title: 'Administer block types',
    description:
      'Maintain the block types of block content available and the fields that are associated with those types.',
    restrict_access: true,
  },
  'administer block content': {
    title: 'View, edit and delete all block content regardless of permission restrictions.',
    description:
      'View, edit and delete all block content regardless of permission restrictions.',
    restrict_access: true,
  },
};

/**
 * Build the per-type permissions for a single block type. Ports
 * `BlockContentPermissions::buildPermissions()`.
 */
export function buildPermissions(type: BlockContentType): PermissionSet {
  const id = type.getId();
  const params = { '%type_name': type.getLabel() };
  return {
    [`create ${id} block content`]: {
      title: t('%type_name: Create new content block', params),
    },
    [`edit any ${id} block content`]: {
      title: t('%type_name: Edit content block', params),
    },
    [`delete any ${id} block content`]: {
      title: t('%type_name: Delete content block', params),
    },
    [`view any ${id} block content history`]: {
      title: t('%type_name: View content block history pages', params),
    },
    [`revert any ${id} block content revisions`]: {
      title: t('%type_name: Revert content block revisions', params),
    },
    [`delete any ${id} block content revisions`]: {
      title: t('%type_name: Delete content block revisions', params),
    },
  };
}

/**
 * The `permission_callbacks` entry. Ports
 * `BlockContentPermissions::blockTypePermissions()`: generates permissions for
 * every block type, merged into one set.
 */
export function blockTypePermissions(types: BlockContentType[]): PermissionSet {
  const result: PermissionSet = {};
  for (const type of types) {
    Object.assign(result, buildPermissions(type));
  }
  return result;
}

/** Convenience: the complete permission set (static + dynamic per type). */
export function allPermissions(types: BlockContentType[] = []): PermissionSet {
  return { ...STATIC_PERMISSIONS, ...blockTypePermissions(types) };
}
