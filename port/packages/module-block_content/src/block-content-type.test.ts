import { describe, it, expect } from 'vitest';
import {
  BlockContentType,
  BLOCK_CONTENT_TYPE_CONFIG_EXPORT,
  BLOCK_CONTENT_TYPE_ENTITY_TYPE,
} from './block-content-type.js';

describe('BlockContentType', () => {
  it('requires an id', () => {
    // @ts-expect-error intentionally missing id
    expect(() => new BlockContentType({ label: 'Basic' })).toThrow(/id/);
  });

  it('exposes id and label', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic block' });
    expect(type.getId()).toBe('basic');
    expect(type.getLabel()).toBe('Basic block');
  });

  it('defaults revision to false and description to empty string', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic' });
    expect(type.shouldCreateNewRevision()).toBe(false);
    expect(type.getDescription()).toBe('');
  });

  it('honours an explicit default-revision setting', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic', revision: true });
    expect(type.shouldCreateNewRevision()).toBe(true);
  });

  it('sets and gets the description fluently', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic' });
    expect(type.setDescription('Reusable text')).toBe(type);
    expect(type.getDescription()).toBe('Reusable text');
  });

  it('is a bundle of block_content', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic' });
    expect(type.getEntityType()).toBe('block_content');
  });

  it('serialises exactly the exported config keys', () => {
    const type = new BlockContentType({
      id: 'basic',
      label: 'Basic',
      revision: true,
      description: 'desc',
    });
    expect(Object.keys(type.toConfig())).toEqual([...BLOCK_CONTENT_TYPE_CONFIG_EXPORT]);
    expect(type.toConfig()).toEqual({
      id: 'basic',
      label: 'Basic',
      revision: true,
      description: 'desc',
    });
  });

  it('declares the correct entity type id and admin permission', () => {
    expect(BLOCK_CONTENT_TYPE_ENTITY_TYPE).toBe('block_content_type');
    expect(BlockContentType.adminPermission).toBe('administer block types');
  });
});
