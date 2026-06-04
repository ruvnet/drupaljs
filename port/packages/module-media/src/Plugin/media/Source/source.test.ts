import { describe, it, expect, vi } from 'vitest';
import { createFileSource } from './File.js';
import { MediaSourceBase } from './MediaSourceBase.js';
import type { MediaSourceDefinition, MediaInterface, FieldItemList } from '../../../contracts.js';

function media(fields: Record<string, FieldItemList>, bundle = 'doc', uuid = 'abc'): MediaInterface {
  return {
    id: () => 1,
    uuid: () => uuid,
    bundle: () => bundle,
    getOwnerId: () => 0,
    isPublished: () => true,
    getName: () => 'n',
    setName() {
      return this;
    },
    getCreatedTime: () => 0,
    getSource: () => {
      throw new Error('not used');
    },
    get: (name) => fields[name] ?? { isEmpty: () => true },
  };
}

describe('MediaSourceBase', () => {
  const def: MediaSourceDefinition = {
    id: 'test',
    label: 'Test',
    allowedFieldTypes: ['file'],
    defaultThumbnailFilename: 'generic.png',
  };

  it('merges defaultConfiguration with the supplied configuration', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test', extra: 1 });
    expect(src.getConfiguration().source_field).toBe('field_test');
    expect(src.getConfiguration().extra).toBe(1);
  });

  it('default_name metadata is media:<bundle>:<uuid>', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test' });
    expect(src.getMetadata(media({}, 'image', 'u-1'), 'default_name')).toBe('media:image:u-1');
  });

  it('thumbnail_uri falls back to icon base + default filename', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test' }, { iconBaseUri: 'public://media-icons' });
    expect(src.getMetadata(media({}), 'thumbnail_uri')).toBe('public://media-icons/generic.png');
  });

  it('unknown metadata attribute returns null', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test' });
    expect(src.getMetadata(media({}), 'nope')).toBeNull();
  });

  it('getSourceFieldValue throws when no source field is configured', () => {
    const src = new MediaSourceBase(def, { source_field: '' });
    expect(() => src.getSourceFieldValue(media({}))).toThrow(/source field/i);
  });

  it('getSourceFieldValue returns null for an empty source field', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test' });
    expect(src.getSourceFieldValue(media({ field_test: { isEmpty: () => true } }))).toBeNull();
  });

  it('getSourceFieldValue returns the primary value of a non-empty field', () => {
    const src = new MediaSourceBase(def, { source_field: 'field_test' });
    const item: FieldItemList = { isEmpty: () => false, value: 42 };
    expect(src.getSourceFieldValue(media({ field_test: item }))).toBe(42);
  });
});

describe('File media source', () => {
  it('declares the file source definition', () => {
    const def = createFileSource({ source_field: 'field_media_file' }).getPluginDefinition();
    expect(def.id).toBe('file');
    expect(def.allowedFieldTypes).toEqual(['file']);
  });

  it('exposes name/mimetype/filesize metadata attributes', () => {
    const attrs = createFileSource({ source_field: 'field_media_file' }).getMetadataAttributes();
    expect(Object.keys(attrs)).toEqual(['name', 'mimetype', 'filesize']);
  });

  it('reads name/mimetype/filesize from the referenced file entity', () => {
    const file = {
      getFilename: vi.fn(() => 'report.pdf'),
      getMimeType: vi.fn(() => 'application/pdf'),
      getSize: vi.fn(() => 1024),
    };
    const src = createFileSource({ source_field: 'field_media_file' });
    const m = media({ field_media_file: { isEmpty: () => false, entity: file } });
    expect(src.getMetadata(m, 'name')).toBe('report.pdf');
    expect(src.getMetadata(m, 'mimetype')).toBe('application/pdf');
    expect(src.getMetadata(m, 'filesize')).toBe(1024);
  });

  it('falls back to base metadata when the source field is empty', () => {
    const src = createFileSource({ source_field: 'field_media_file' });
    const m = media({ field_media_file: { isEmpty: () => true } }, 'doc', 'xyz');
    expect(src.getMetadata(m, 'default_name')).toBe('media:doc:xyz');
  });
});
