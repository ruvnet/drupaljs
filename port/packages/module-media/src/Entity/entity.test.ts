import { describe, it, expect, vi } from 'vitest';
import { MediaType } from './MediaType.js';
import { Media } from './Media.js';
import { mediaEntityType, mediaTypeEntityType } from './definitions.js';
import { createFileSource } from '../Plugin/media/Source/File.js';
import type { MediaSourceInterface, FieldItemList } from '../contracts.js';

describe('entity type definitions', () => {
  it('media entity type carries Drupal entity keys', () => {
    expect(mediaEntityType.id).toBe('media');
    expect(mediaEntityType.entityKeys.id).toBe('mid');
    expect(mediaEntityType.entityKeys.bundle).toBe('bundle');
    expect(mediaEntityType.adminPermission).toBe('administer media');
    expect(mediaEntityType.bundleEntityType).toBe('media_type');
  });
  it('media_type config entity carries config_export keys', () => {
    expect(mediaTypeEntityType.id).toBe('media_type');
    expect(mediaTypeEntityType.bundleOf).toBe('media');
    expect(mediaTypeEntityType.configExport).toContain('source');
    expect(mediaTypeEntityType.adminPermission).toBe('administer media types');
  });
});

describe('MediaType (bundle config entity)', () => {
  it('exposes id/label/source/field_map and queue flag', () => {
    const source = createFileSource({ source_field: 'field_media_file' });
    const type = new MediaType({
      id: 'document',
      label: 'Document',
      source: 'file',
      source_configuration: { source_field: 'field_media_file' },
      queue_thumbnail_downloads: true,
      field_map: { name: 'name' },
    }, () => source);

    expect(type.id()).toBe('document');
    expect(type.label()).toBe('Document');
    expect(type.thumbnailDownloadsAreQueued()).toBe(true);
    expect(type.getFieldMap()).toEqual({ name: 'name' });
    expect(type.getSource()).toBe(source);
  });
});

describe('Media (content entity)', () => {
  const source: MediaSourceInterface = {
    getPluginDefinition: () => ({
      id: 'file',
      label: 'File',
      allowedFieldTypes: ['file'],
      defaultNameMetadataAttribute: 'default_name',
    }),
    getConfiguration: () => ({ source_field: 'field_media_file' }),
    getMetadataAttributes: () => ({}),
    getMetadata: vi.fn(() => 'derived-name'),
    getSourceFieldValue: () => null,
  };

  const type = new MediaType(
    { id: 'document', label: 'Document', source: 'file', source_configuration: { source_field: 'field_media_file' } },
    () => source,
  );

  function make(values: { name?: string | null; uid?: number; status?: boolean }): Media {
    return new Media(
      {
        mid: 1,
        uuid: 'uuid-1',
        bundle: 'document',
        name: values.name ?? null,
        uid: values.uid ?? 0,
        status: values.status ?? true,
        created: 12345,
        fields: {},
      },
      type,
    );
  }

  it('returns explicit name when set', () => {
    expect(make({ name: 'My file' }).getName()).toBe('My file');
  });

  it('falls back to the source default name when name is empty', () => {
    const m = make({ name: null });
    expect(m.getName()).toBe('derived-name');
    expect(source.getMetadata).toHaveBeenCalledWith(m, 'default_name');
  });

  it('setName updates the name and is chainable', () => {
    const m = make({ name: null });
    expect(m.setName('Renamed')).toBe(m);
    expect(m.getName()).toBe('Renamed');
  });

  it('exposes bundle, owner, published, created and source', () => {
    const m = make({ uid: 7, status: false });
    expect(m.bundle()).toBe('document');
    expect(m.getOwnerId()).toBe(7);
    expect(m.isPublished()).toBe(false);
    expect(m.getCreatedTime()).toBe(12345);
    expect(m.getSource()).toBe(source);
  });

  it('get() returns an empty field item list for an unset field', () => {
    const list: FieldItemList = make({}).get('field_media_file');
    expect(list.isEmpty()).toBe(true);
  });
});
