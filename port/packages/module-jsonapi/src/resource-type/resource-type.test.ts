import { describe, it, expect } from 'vitest';
import { ResourceType, TYPE_NAME_URI_PATH_SEPARATOR } from './resource-type.js';
import {
  ResourceTypeAttribute,
  ResourceTypeRelationship,
} from './resource-type-field.js';

describe('ResourceType', () => {
  it('derives the type name from entityType--bundle', () => {
    const rt = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
    expect(rt.getEntityTypeId()).toBe('node');
    expect(rt.getBundle()).toBe('article');
    expect(rt.getTypeName()).toBe('node--article');
  });

  it('honours an explicit type name', () => {
    const rt = new ResourceType({
      entityTypeId: 'node',
      bundle: 'article',
      typeName: 'custom',
    });
    expect(rt.getTypeName()).toBe('custom');
  });

  it('getPath replaces the "--" separator with "/"', () => {
    const rt = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
    expect(rt.getPath()).toBe('/node/article');
    expect(TYPE_NAME_URI_PATH_SEPARATOR).toBe('--');
  });

  it('defaults: not internal, locatable, mutable, not versionable', () => {
    const rt = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
    expect(rt.isInternal()).toBe(false);
    expect(rt.isLocatable()).toBe(true);
    expect(rt.isMutable()).toBe(true);
    expect(rt.isVersionable()).toBe(false);
    expect(rt.includeCount()).toBe(false);
  });

  it('respects the flags it is constructed with', () => {
    const rt = new ResourceType({
      entityTypeId: 'node',
      bundle: 'article',
      internal: true,
      locatable: false,
      mutable: false,
      versionable: true,
    });
    expect(rt.isInternal()).toBe(true);
    expect(rt.isLocatable()).toBe(false);
    expect(rt.isMutable()).toBe(false);
    expect(rt.isVersionable()).toBe(true);
  });

  it('maps public <-> internal field names via the field set', () => {
    const rt = new ResourceType({
      entityTypeId: 'node',
      bundle: 'article',
      fields: [new ResourceTypeAttribute('field_body', 'body')],
    });
    expect(rt.getPublicName('field_body')).toBe('body');
    expect(rt.getInternalName('body')).toBe('field_body');
    // Unknown names round-trip unchanged.
    expect(rt.getPublicName('title')).toBe('title');
    expect(rt.getInternalName('title')).toBe('title');
  });

  it('hasField / isFieldEnabled / getFieldByPublicName operate on internal keys', () => {
    const body = new ResourceTypeAttribute('field_body', 'body');
    const secret = new ResourceTypeAttribute('field_secret', 'secret').disabled();
    const rt = new ResourceType({
      entityTypeId: 'node',
      bundle: 'article',
      fields: [body, secret],
    });
    expect(rt.hasField('field_body')).toBe(true);
    expect(rt.hasField('nope')).toBe(false);
    expect(rt.isFieldEnabled('field_body')).toBe(true);
    expect(rt.isFieldEnabled('field_secret')).toBe(false);
    expect(rt.getFieldByPublicName('body')).toBe(body);
    expect(rt.getFieldByPublicName('missing')).toBeNull();
    expect(rt.getFieldByInternalName('field_body')).toBe(body);
  });

  it('collects relatable resource types from enabled relationship fields only', () => {
    const uid = new ResourceTypeRelationship(
      'uid',
      'uid',
      true,
      true,
    ).withRelatableResourceTypeNames(['user--user']);
    const disabledRel = new ResourceTypeRelationship(
      'field_hidden',
      'hidden',
      false,
      true,
    ).withRelatableResourceTypeNames(['node--page']);
    const rt = new ResourceType({
      entityTypeId: 'node',
      bundle: 'article',
      fields: [new ResourceTypeAttribute('title'), uid, disabledRel],
    });
    expect(rt.getRelatableResourceTypes()).toEqual({ uid: ['user--user'] });
    expect(rt.getRelatableResourceTypesByField('uid')).toEqual(['user--user']);
    // Attribute fields are never relatable.
    expect(rt.getRelatableResourceTypesByField('title')).toEqual([]);
  });
});
