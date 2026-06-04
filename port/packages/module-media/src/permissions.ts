/**
 * Media permissions. Ports core/modules/media/media.permissions.yml (the
 * static module permissions) and core/modules/media/src/MediaPermissions.php
 * (the dynamic per-bundle permission callback).
 */
import type { MediaTypeInterface, PermissionMap } from './contracts.js';

/**
 * Module-level permissions declared in media.permissions.yml (minus the
 * `permission_callbacks` entry, which is realised by {@link mediaTypePermissions}).
 */
export function mediaStaticPermissions(): PermissionMap {
  return {
    'administer media': { title: 'Administer media', restrictAccess: true },
    'administer media types': { title: 'Administer media types', restrictAccess: true },
    'view media': { title: 'View media' },
    // @todo Deprecate per https://www.drupal.org/project/drupal/issues/2925459.
    'update media': { title: 'Update own media' },
    'update any media': { title: 'Update any media' },
    'delete media': { title: 'Delete own media' },
    'delete any media': { title: 'Delete any media' },
    'create media': { title: 'Create media' },
    'view all media revisions': {
      title: 'View all media revisions',
      description: 'To view a revision, you also need permission to view the media item.',
    },
    'access media overview': {
      title: 'Access media overview',
      description: 'Users with this permission can access the media overview page.',
    },
    'view own unpublished media': { title: 'View own unpublished media' },
  };
}

/**
 * Builds the per-type permissions for a single media type.
 * Ports MediaPermissions::buildPermissions().
 */
export function buildMediaTypePermissions(type: MediaTypeInterface): PermissionMap {
  const id = type.id();
  const name = type.label();
  return {
    [`create ${id} media`]: { title: `${name}: Create new media` },
    [`edit own ${id} media`]: { title: `${name}: Edit own media` },
    [`edit any ${id} media`]: { title: `${name}: Edit any media` },
    [`delete own ${id} media`]: { title: `${name}: Delete own media` },
    [`delete any ${id} media`]: { title: `${name}: Delete any media` },
    [`view any ${id} media revisions`]: { title: `${name}: View any media revision pages` },
    [`revert any ${id} media revisions`]: { title: `Revert ${name}: Revert media revisions` },
    [`delete any ${id} media revisions`]: { title: `Delete ${name}: Delete media revisions` },
  };
}

/**
 * Dynamic permission callback merging per-bundle permissions across all media
 * types. Ports MediaPermissions::mediaTypePermissions() (the type list is
 * injected here instead of loaded from storage).
 */
export function mediaTypePermissions(types: readonly MediaTypeInterface[]): PermissionMap {
  const result: PermissionMap = {};
  for (const type of types) {
    Object.assign(result, buildMediaTypePermissions(type));
  }
  return result;
}
