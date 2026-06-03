import { describe, it, expect } from 'vitest';
import { NestedArray } from './nested-array.js';

describe('NestedArray', () => {
  describe('getValue', () => {
    it('returns a nested value when all parents exist', () => {
      const data = { foo: { bar: 'baz' } };
      const result = NestedArray.getValue(data, ['foo', 'bar']);
      expect(result.value).toBe('baz');
      expect(result.keyExists).toBe(true);
    });

    it('returns keyExists=false when a parent is missing', () => {
      const data = { foo: { bar: 'baz' } };
      const result = NestedArray.getValue(data, ['foo', 'missing']);
      expect(result.value).toBeUndefined();
      expect(result.keyExists).toBe(false);
    });

    it('distinguishes a stored null from a missing key', () => {
      const data = { foo: { bar: null } };
      expect(NestedArray.getValue(data, ['foo', 'bar']).keyExists).toBe(true);
      expect(NestedArray.getValue(data, ['foo', 'nope']).keyExists).toBe(false);
    });
  });

  describe('setValue', () => {
    it('creates intermediate containers', () => {
      const data: Record<string, unknown> = {};
      NestedArray.setValue(data, ['a', 'b', 'c'], 42);
      expect(data).toEqual({ a: { b: { c: 42 } } });
    });

    it('overwrites an existing leaf', () => {
      const data: Record<string, unknown> = { a: { b: 1 } };
      NestedArray.setValue(data, ['a', 'b'], 2);
      expect(data).toEqual({ a: { b: 2 } });
    });

    it('throws when traversing a non-array value without force', () => {
      const data: Record<string, unknown> = { a: 1 };
      expect(() => NestedArray.setValue(data, ['a', 'b'], 2)).toThrow();
    });

    it('forces structure over a non-array value when force=true', () => {
      const data: Record<string, unknown> = { a: 1 };
      NestedArray.setValue(data, ['a', 'b'], 2, true);
      expect(data).toEqual({ a: { b: 2 } });
    });
  });

  describe('unsetValue', () => {
    it('removes a nested key', () => {
      const data: Record<string, unknown> = { a: { b: 1, c: 2 } };
      NestedArray.unsetValue(data, ['a', 'b']);
      expect(data).toEqual({ a: { c: 2 } });
    });

    it('is a no-op when the key path does not exist', () => {
      const data: Record<string, unknown> = { a: { b: 1 } };
      NestedArray.unsetValue(data, ['a', 'x']);
      expect(data).toEqual({ a: { b: 1 } });
    });
  });

  describe('keyExists', () => {
    it('returns true/false based on parent presence', () => {
      const data = { a: { b: { c: 1 } } };
      expect(NestedArray.keyExists(data, ['a', 'b', 'c'])).toBe(true);
      expect(NestedArray.keyExists(data, ['a', 'b', 'd'])).toBe(false);
    });
  });

  describe('mergeDeepArray', () => {
    it('replaces scalars and merges nested objects', () => {
      const a = { fragment: 'x', attributes: { title: 'X', cls: { keep: 1 } } };
      const b = { fragment: 'y', attributes: { title: 'Y', cls: { add: 2 } } };
      expect(NestedArray.mergeDeepArray([a, b])).toEqual({
        fragment: 'y',
        attributes: { title: 'Y', cls: { keep: 1, add: 2 } },
      });
    });

    it('appends array (integer-keyed) values by default', () => {
      const a = { list: ['a', 'b'] };
      const b = { list: ['c', 'd'] };
      expect(NestedArray.mergeDeepArray([a, b])).toEqual({ list: ['a', 'b', 'c', 'd'] });
    });

    it('preserves/merges integer keys when preserveIntegerKeys=true', () => {
      const a = { list: ['a', 'b'] };
      const b = { list: ['c'] };
      expect(NestedArray.mergeDeepArray([a, b], true)).toEqual({ list: ['c', 'b'] });
    });
  });
});
