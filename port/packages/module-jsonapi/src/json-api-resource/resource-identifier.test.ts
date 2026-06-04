import { describe, it, expect } from 'vitest';
import { ResourceIdentifier } from './resource-identifier.js';
import { ResourceType } from '../resource-type/resource-type.js';

describe('ResourceIdentifier', () => {
  it('accepts a type name string', () => {
    const ri = new ResourceIdentifier('node--article', 'abc');
    expect(ri.getTypeName()).toBe('node--article');
    expect(ri.getId()).toBe('abc');
  });

  it('accepts a ResourceType and reads its type name', () => {
    const rt = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
    const ri = new ResourceIdentifier(rt, 'abc');
    expect(ri.getTypeName()).toBe('node--article');
  });

  it('tracks arity through meta', () => {
    const ri = new ResourceIdentifier('node--article', 'abc');
    expect(ri.hasArity()).toBe(false);
    const withArity = ri.withArity(2);
    expect(withArity.hasArity()).toBe(true);
    expect(withArity.getArity()).toBe(2);
    // Original is untouched.
    expect(ri.hasArity()).toBe(false);
  });

  it('compare orders by type:id then by arity', () => {
    const a = new ResourceIdentifier('node--article', '1');
    const b = new ResourceIdentifier('node--article', '2');
    expect(ResourceIdentifier.compare(a, b)).toBeLessThan(0);
    expect(ResourceIdentifier.compare(b, a)).toBeGreaterThan(0);
    expect(ResourceIdentifier.compare(a, a)).toBe(0);

    const a0 = a.withArity(0);
    const a1 = a.withArity(1);
    expect(ResourceIdentifier.compare(a0, a1)).toBe(-1);
    expect(ResourceIdentifier.compare(a1, a0)).toBe(1);
  });

  it('isDuplicate treats same type+id (without distinct arity) as duplicate', () => {
    const a = new ResourceIdentifier('node--article', '1');
    const b = new ResourceIdentifier('node--article', '1');
    expect(ResourceIdentifier.isDuplicate(a, b)).toBe(true);
    // Distinct arity => not duplicate.
    expect(ResourceIdentifier.isDuplicate(a.withArity(0), b.withArity(1))).toBe(false);
  });

  it('isParallel ignores arity', () => {
    const a = new ResourceIdentifier('node--article', '1').withArity(0);
    const b = new ResourceIdentifier('node--article', '1').withArity(3);
    expect(ResourceIdentifier.isParallel(a, b)).toBe(true);
  });

  it('deduplicate removes duplicates and reports uniqueness', () => {
    const a = new ResourceIdentifier('node--article', '1');
    const b = new ResourceIdentifier('node--article', '1');
    const c = new ResourceIdentifier('node--article', '2');
    const out = ResourceIdentifier.deduplicate([a, b, c]);
    expect(out).toHaveLength(2);
    expect(ResourceIdentifier.areResourceIdentifiersUnique([a, b])).toBe(false);
    expect(ResourceIdentifier.areResourceIdentifiersUnique([a, c])).toBe(true);
  });
});
