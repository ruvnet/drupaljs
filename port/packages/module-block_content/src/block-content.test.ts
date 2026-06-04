import { describe, it, expect, vi } from 'vitest';
import {
  BlockContent,
  BLOCK_CONTENT_ENTITY_KEYS,
  BLOCK_CONTENT_BASE_FIELDS,
} from './block-content.js';

const make = (overrides = {}, loader?: (id: string) => unknown[]) =>
  new BlockContent({ type: 'basic', info: 'Hello', ...overrides }, loader);

describe('BlockContent', () => {
  it('requires a bundle type', () => {
    // @ts-expect-error missing type
    expect(() => new BlockContent({ info: 'x' })).toThrow(/type/);
  });

  it('uses info as label and bundle as type', () => {
    const block = make();
    expect(block.label()).toBe('Hello');
    expect(block.bundle()).toBe('basic');
  });

  it('defaults to reusable and published with an auto uuid', () => {
    const block = make();
    expect(block.isReusable()).toBe(true);
    expect(block.isPublished()).toBe(true);
    expect(block.uuid).toMatch(/[0-9a-f-]{36}/);
  });

  it('toggles reusable fluently', () => {
    const block = make();
    expect(block.setNonReusable()).toBe(block);
    expect(block.isReusable()).toBe(false);
    block.setReusable();
    expect(block.isReusable()).toBe(true);
  });

  it('sets info and theme fluently', () => {
    const block = make();
    expect(block.setInfo('Renamed')).toBe(block);
    expect(block.getInfo()).toBe('Renamed');
    expect(block.getTheme()).toBeNull();
    block.setTheme('olivero');
    expect(block.getTheme()).toBe('olivero');
  });

  it('toggles published state', () => {
    const block = make({ status: false });
    expect(block.isPublished()).toBe(false);
    block.setPublished();
    expect(block.isPublished()).toBe(true);
  });

  it('createDuplicate clears id and revision but copies content', () => {
    const block = make({ id: 7, revisionId: 12, reusable: false });
    const dup = block.createDuplicate();
    expect(dup.id).toBeNull();
    expect(dup.revisionId).toBeNull();
    expect(dup.getInfo()).toBe('Hello');
    expect(dup.isReusable()).toBe(false);
    expect(dup.uuid).not.toBe(block.uuid);
  });

  it('getInstances queries placed blocks by plugin id block_content:<uuid>', () => {
    const loader = vi.fn().mockReturnValue([{ plugin: 'x' }]);
    const block = make({ uuid: 'abc-uuid' }, loader);
    const instances = block.getInstances();
    expect(loader).toHaveBeenCalledWith('block_content:abc-uuid');
    expect(instances).toHaveLength(1);
  });

  it('exposes the canonical entity keys and base fields', () => {
    expect(BLOCK_CONTENT_ENTITY_KEYS.bundle).toBe('type');
    expect(BLOCK_CONTENT_ENTITY_KEYS.label).toBe('info');
    expect(BLOCK_CONTENT_ENTITY_KEYS.published).toBe('status');
    expect(BLOCK_CONTENT_BASE_FIELDS.info.required).toBe(true);
    expect(BLOCK_CONTENT_BASE_FIELDS.reusable.defaultValue).toBe(true);
  });

  it('declares module permissions', () => {
    expect(BlockContent.adminPermission).toBe('administer block content');
    expect(BlockContent.collectionPermission).toBe('access block library');
  });
});
