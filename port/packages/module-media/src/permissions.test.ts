import { describe, it, expect } from 'vitest';
import { mediaStaticPermissions, buildMediaTypePermissions, mediaTypePermissions } from './permissions.js';
import type { MediaTypeInterface } from './contracts.js';

function mediaType(id: string, label: string): MediaTypeInterface {
  return {
    id: () => id,
    label: () => label,
    getDescription: () => undefined,
    thumbnailDownloadsAreQueued: () => false,
    getSource: () => {
      throw new Error('not used');
    },
    getFieldMap: () => ({}),
  };
}

describe('media static permissions', () => {
  it('exposes the module-level permissions from media.permissions.yml', () => {
    const perms = mediaStaticPermissions();
    expect(perms['administer media']).toBeDefined();
    expect(perms['administer media']!.restrictAccess).toBe(true);
    expect(perms['view media']).toBeDefined();
    expect(perms['create media']).toBeDefined();
    expect(perms['view own unpublished media']).toBeDefined();
    expect(perms['access media overview']).toBeDefined();
  });
});

describe('buildMediaTypePermissions', () => {
  it('generates the 8 per-bundle permissions for a media type', () => {
    const perms = buildMediaTypePermissions(mediaType('image', 'Image'));
    expect(Object.keys(perms)).toEqual([
      'create image media',
      'edit own image media',
      'edit any image media',
      'delete own image media',
      'delete any image media',
      'view any image media revisions',
      'revert any image media revisions',
      'delete any image media revisions',
    ]);
    expect(perms['create image media']!.title).toContain('Image');
  });
});

describe('mediaTypePermissions (dynamic callback)', () => {
  it('merges per-bundle permissions across all media types', () => {
    const perms = mediaTypePermissions([mediaType('image', 'Image'), mediaType('audio', 'Audio')]);
    expect(perms['create image media']).toBeDefined();
    expect(perms['delete any audio media revisions']).toBeDefined();
  });
});
