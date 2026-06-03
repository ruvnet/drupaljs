import { describe, it, expect } from 'vitest';
import { NestedArray } from './NestedArray.js';

describe('NestedArray.getValue', () => {
  it('retrieves a deeply nested value', () => {
    const data = { a: { b: { c: 42 } } };
    expect(NestedArray.getValue(data, ['a', 'b', 'c'])).toBe(42);
  });

  it('returns the container itself for an empty parents list', () => {
    const data = { a: 1 };
    expect(NestedArray.getValue(data, [])).toBe(data);
  });

  it('returns undefined when a parent key is missing', () => {
    const data = { a: { b: 1 } };
    expect(NestedArray.getValue(data, ['a', 'x'])).toBeUndefined();
  });

  it('returns a stored null value (distinct from missing)', () => {
    const data = { a: { b: null } };
    expect(NestedArray.getValue(data, ['a', 'b'])).toBeNull();
  });

  it('reads through array indices', () => {
    const data = { list: [{ v: 'x' }, { v: 'y' }] };
    expect(NestedArray.getValue(data, ['list', 1, 'v'])).toBe('y');
  });
});

describe('NestedArray.setValue', () => {
  it('sets a value at an existing path', () => {
    const data: Record<string, unknown> = { a: { b: 1 } };
    NestedArray.setValue(data, ['a', 'b'], 2);
    expect(data).toEqual({ a: { b: 2 } });
  });

  it('auto-creates intermediate containers', () => {
    const data: Record<string, unknown> = {};
    NestedArray.setValue(data, ['a', 'b', 'c'], 'v');
    expect(data).toEqual({ a: { b: { c: 'v' } } });
  });

  it('throws when a parent is a non-container and force is false', () => {
    const data: Record<string, unknown> = { a: 5 };
    expect(() => NestedArray.setValue(data, ['a', 'b'], 1)).toThrow(
      /Cannot create key "a"/,
    );
  });

  it('overwrites a non-container parent when force is true', () => {
    const data: Record<string, unknown> = { a: 5 };
    NestedArray.setValue(data, ['a', 'b'], 1, true);
    expect(data).toEqual({ a: { b: 1 } });
  });
});

describe('NestedArray.unsetValue', () => {
  it('removes an existing key and reports true', () => {
    const data: Record<string, unknown> = { a: { b: 1, c: 2 } };
    expect(NestedArray.unsetValue(data, ['a', 'b'])).toBe(true);
    expect(data).toEqual({ a: { c: 2 } });
  });

  it('reports false when the key does not exist', () => {
    const data: Record<string, unknown> = { a: { c: 2 } };
    expect(NestedArray.unsetValue(data, ['a', 'b'])).toBe(false);
    expect(data).toEqual({ a: { c: 2 } });
  });
});

describe('NestedArray.keyExists', () => {
  it('returns true when all parents exist', () => {
    expect(NestedArray.keyExists({ a: { b: null } }, ['a', 'b'])).toBe(true);
  });
  it('returns false when a parent is missing', () => {
    expect(NestedArray.keyExists({ a: {} }, ['a', 'b'])).toBe(false);
  });
});

describe('NestedArray.mergeDeep / mergeDeepArray', () => {
  it('replaces scalars with the latter value and recurses into objects', () => {
    const one = { fragment: 'x', attributes: { title: 'X', class: ['a', 'b'] } };
    const two = { fragment: 'y', attributes: { title: 'Y', class: ['c', 'd'] } };
    const merged = NestedArray.mergeDeep(one, two);
    expect(merged).toEqual({
      fragment: 'y',
      attributes: { title: 'Y', class: ['a', 'b', 'c', 'd'] },
    });
  });

  it('appends (renumbers) integer keys by default', () => {
    const merged = NestedArray.mergeDeepArray([['a', 'b'], ['c', 'd']]);
    expect(merged).toEqual(['a', 'b', 'c', 'd']);
  });

  it('preserves integer keys when requested (overlapping keys merge)', () => {
    // With preserveIntegerKeys, key 0 from the second wins over the first;
    // non-overlapping keys are kept by index rather than appended.
    const merged = NestedArray.mergeDeepArray(
      [{ 0: 'a', 1: 'b' }, { 0: 'A', 2: 'c' }],
      true,
    );
    // Contiguous integer keys (0,1,2) surface as a real array in JS.
    expect(merged).toEqual(['A', 'b', 'c']);
  });

  it('keeps sparse integer keys as an object when preserving', () => {
    const merged = NestedArray.mergeDeepArray([{ 5: 'x' }, { 9: 'y' }], true);
    expect(merged).toEqual({ 5: 'x', 9: 'y' });
  });
});

describe('NestedArray.filter', () => {
  it('removes falsy values by default and recurses', () => {
    const data = { a: 0, b: { c: '', d: 'keep' }, e: 'x' };
    expect(NestedArray.filter(data)).toEqual({ b: { d: 'keep' }, e: 'x' });
  });

  it('applies a custom predicate', () => {
    const data = { a: 1, b: 2, c: 3 };
    expect(NestedArray.filter(data, (v) => (v as number) > 1)).toEqual({
      b: 2,
      c: 3,
    });
  });
});
