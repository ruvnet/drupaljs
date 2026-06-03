/**
 * Port of `node.permissions.yml` (static permissions) and
 * `Drupal\node\NodePermissions` (dynamic per-bundle permissions).
 */

import type { PermissionMap } from './contracts.js';
import type { NodeTypeInterface } from './entity/node-type.js';

/**
 * Static node permissions. Faithful to node.permissions.yml.
 *
 * Note: `access content` itself is provided by core (system) in Drupal, not the
 * node module; it is referenced by the access handler but not declared here.
 */
export function nodePermissions(): PermissionMap {
  return {
    'bypass node access': {
      title: 'Bypass content access control',
      description:
        'View, edit and delete all content regardless of permission restrictions.',
      restrict_access: true,
    },
    'administer content types': {
      title: 'Administer content types',
      description:
        'Maintain the types of content available and the fields that are associated with those types.',
      restrict_access: true,
    },
    'administer nodes': {
      title: 'Administer content',
      description:
        'Promote, change ownership, edit revisions, and perform other tasks across all content types.',
      restrict_access: true,
    },
    'access content overview': {
      title: 'Access the Content overview page',
    },
    'view own unpublished content': {
      title: 'View own unpublished content',
    },
    'view all revisions': {
      title: 'View all revisions',
      description: 'To view a revision, you also need permission to view the content item.',
    },
    'revert all revisions': {
      title: 'Revert all revisions',
      description: 'To revert a revision, you also need permission to edit the content item.',
    },
    'delete all revisions': {
      title: 'Delete all revisions',
      description: 'To delete a revision, you also need permission to delete the content item.',
    },
    'rebuild node access permissions': {
      title: 'Rebuild content access permissions',
      description:
        'Trigger a content access permission rebuild. This can be a potentially long and disruptive process.',
      restrict_access: true,
    },
    'administer node published status': {
      title: 'Administer node published status',
      description: 'Edit the published status of a node across all content types.',
      restrict_access: true,
    },
  };
}

/**
 * Dynamic per-bundle node permissions. Ports
 * `Drupal\node\NodePermissions::nodeTypePermissions()` + buildPermissions().
 * The string-translation `%type_name` placeholder is inlined as plain text.
 */
export function nodeTypePermissions(types: NodeTypeInterface[]): PermissionMap {
  const permissions: PermissionMap = {};
  for (const type of types) {
    const id = type.id();
    const name = type.label();
    Object.assign(permissions, {
      [`create ${id} content`]: {
        title: `${name}: Create new content`,
      },
      [`edit own ${id} content`]: {
        title: `${name}: Edit own content`,
        description:
          'Note that anonymous users with this permission are able to edit any content created by any anonymous user.',
      },
      [`edit any ${id} content`]: {
        title: `${name}: Edit any content`,
      },
      [`delete own ${id} content`]: {
        title: `${name}: Delete own content`,
        description:
          'Note that anonymous users with this permission are able to delete any content created by any anonymous user.',
      },
      [`delete any ${id} content`]: {
        title: `${name}: Delete any content`,
      },
      [`view ${id} revisions`]: {
        title: `${name}: View revisions`,
        description: 'To view a revision, you also need permission to view the content item.',
      },
      [`revert ${id} revisions`]: {
        title: `${name}: Revert revisions`,
        description: 'To revert a revision, you also need permission to edit the content item.',
      },
      [`delete ${id} revisions`]: {
        title: `${name}: Delete revisions`,
        description: 'To delete a revision, you also need permission to delete the content item.',
      },
    });
  }
  return permissions;
}
