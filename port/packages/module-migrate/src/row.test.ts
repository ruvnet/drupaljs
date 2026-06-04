import { describe, it, expect } from 'vitest';
import { Row } from './row.js';
import { IdMapStatus } from './contracts.js';

describe('Row', () => {
  it('exposes source values and source IDs in declared order', () => {
    const row = new Row({ id: 7, title: 'Hello' }, { id: { type: 'integer' } });
    expect(row.getSource()).toEqual({ id: 7, title: 'Hello' });
    expect(row.getSourceIdValues()).toEqual({ id: 7 });
    expect(row.hasSourceProperty('title')).toBe(true);
    expect(row.hasSourceProperty('missing')).toBe(false);
    expect(row.getSourceProperty('title')).toBe('Hello');
    expect(row.getSourceProperty('missing')).toBeUndefined();
  });

  it('throws when a declared source ID has no value', () => {
    expect(() => new Row({ id: 1 }, { other: { type: 'integer' } })).toThrow(
      /'other' is defined as a source ID but has no value/,
    );
  });

  it('reads and writes nested source properties via the / separator', () => {
    const row = new Row({ id: 1 });
    row.setSourceProperty('a/b', 42);
    expect(row.getSourceProperty('a/b')).toBe(42);
    expect(row.hasSourceProperty('a/b')).toBe(true);
  });

  it('freezes the source against further writes', () => {
    const row = new Row({ id: 1 });
    row.freezeSource();
    expect(() => row.setSourceProperty('x', 1)).toThrow(/frozen/);
  });

  it('stores destination properties (raw + nested) and removes them', () => {
    const row = new Row({ id: 1 });
    row.setDestinationProperty('foo/bar', 'baz');
    expect(row.getDestination()).toEqual({ foo: { bar: 'baz' } });
    expect(row.getRawDestination()).toEqual({ 'foo/bar': 'baz' });
    expect(row.hasDestinationProperty('foo/bar')).toBe(true);
    expect(row.getDestinationProperty('foo/bar')).toBe('baz');
    row.removeDestinationProperty('foo/bar');
    expect(row.hasDestinationProperty('foo/bar')).toBe(false);
    expect(row.getRawDestination()).toEqual({});
  });

  it('tracks empty destination properties', () => {
    const row = new Row({ id: 1 });
    row.setEmptyDestinationProperty('alpha');
    expect(row.getEmptyDestinationProperties()).toEqual(['alpha']);
    expect(row.hasEmptyDestinationProperty('alpha')).toBe(true);
    row.removeEmptyDestinationProperty('alpha');
    expect(row.hasEmptyDestinationProperty('alpha')).toBe(false);
  });

  it('get() resolves source by default and destination for @-prefixed keys', () => {
    const row = new Row({ name: 'src' });
    row.setDestinationProperty('name', 'dest');
    expect(row.get('name')).toBe('src');
    expect(row.get('@name')).toBe('dest');
    // Escaped @@ resolves a literal-@ source property.
    row.setSourceProperty('@weird', 'at');
    expect(row.get('@@weird')).toBe('at');
  });

  it('getMultiple keys results by the original property names', () => {
    const row = new Row({ a: 1, b: 2 });
    expect(row.getMultiple(['a', 'b'])).toEqual({ a: 1, b: 2 });
  });

  it('rehash() detects whether source content changed', () => {
    const row = new Row({ id: 1, v: 'one' });
    row.rehash();
    const first = row.getHash();
    expect(typeof first).toBe('string');
    // After re-hashing identical content, original_hash == hash => unchanged.
    row.rehash();
    expect(row.getHash()).toBe(first);
    expect(row.changed()).toBe(false);
    // Mutating the source then re-hashing flips changed() to true.
    row.setSourceProperty('v', 'two');
    row.rehash();
    expect(row.changed()).toBe(true);
  });

  it('needsUpdate reflects the id-map source_row_status', () => {
    const row = new Row({ id: 1 });
    expect(row.needsUpdate()).toBe(true);
    row.setIdMap({ original_hash: '', hash: '', source_row_status: IdMapStatus.IMPORTED });
    expect(row.needsUpdate()).toBe(false);
  });

  it('clones without destination and preserves stub flag and frozen state', () => {
    const row = new Row({ id: 1 }, { id: { type: 'integer' } }, true);
    row.setDestinationProperty('x', 1);
    const clone = row.cloneWithoutDestination();
    expect(clone.isStub()).toBe(true);
    expect(clone.getDestination()).toEqual({});
    expect(clone.getSource()).toEqual({ id: 1 });
    expect(() => clone.setSourceProperty('y', 2)).toThrow(/frozen/);
  });
});
