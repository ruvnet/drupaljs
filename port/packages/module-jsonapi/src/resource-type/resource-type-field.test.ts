import { describe, it, expect } from 'vitest';
import {
  ResourceTypeAttribute,
  ResourceTypeRelationship,
} from './resource-type-field.js';

describe('ResourceTypeField (ResourceTypeAttribute / ResourceTypeRelationship)', () => {
  it('defaults the public name to the internal name', () => {
    const f = new ResourceTypeAttribute('title');
    expect(f.getInternalName()).toBe('title');
    expect(f.getPublicName()).toBe('title');
  });

  it('uses the supplied public name when given', () => {
    const f = new ResourceTypeAttribute('field_body', 'body');
    expect(f.getInternalName()).toBe('field_body');
    expect(f.getPublicName()).toBe('body');
  });

  it('is enabled and hasOne by default', () => {
    const f = new ResourceTypeAttribute('title');
    expect(f.isFieldEnabled()).toBe(true);
    expect(f.hasOne()).toBe(true);
    expect(f.hasMany()).toBe(false);
  });

  it('withPublicName returns a new instance preserving other state', () => {
    const f = new ResourceTypeAttribute('field_body', 'body', false, false);
    const renamed = f.withPublicName('summary');
    expect(renamed).not.toBe(f);
    expect(renamed.getPublicName()).toBe('summary');
    expect(renamed.getInternalName()).toBe('field_body');
    expect(renamed.isFieldEnabled()).toBe(false);
    expect(renamed.hasMany()).toBe(true);
    // Original unchanged (immutability).
    expect(f.getPublicName()).toBe('body');
  });

  it('disabled()/enabled() flip the enabled flag immutably', () => {
    const f = new ResourceTypeAttribute('title');
    const off = f.disabled();
    expect(off.isFieldEnabled()).toBe(false);
    expect(f.isFieldEnabled()).toBe(true);
    expect(off.enabled().isFieldEnabled()).toBe(true);
  });

  it('relationship tracks relatable resource type names', () => {
    const rel = new ResourceTypeRelationship('uid', 'uid', true, true);
    expect(rel.getRelatableResourceTypeNames()).toEqual([]);
    const withTargets = rel.withRelatableResourceTypeNames(['user--user']);
    expect(withTargets).not.toBe(rel);
    expect(withTargets.getRelatableResourceTypeNames()).toEqual(['user--user']);
    // Preserves field identity.
    expect(withTargets.getInternalName()).toBe('uid');
  });
});
