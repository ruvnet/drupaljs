import { describe, it, expect } from 'vitest';
import { TypedDataManager } from './manager.js';
import { DataDefinition } from './definition.js';
import { ListDataDefinition } from './list-definition.js';
import { MapDataDefinition } from './map-definition.js';
import type { ComplexDataInterface, ListInterface } from './contracts.js';

const manager = (): TypedDataManager => new TypedDataManager();

describe('Map (complex data)', () => {
  const buildDef = (): MapDataDefinition => {
    const def = MapDataDefinition.create();
    def.setPropertyDefinition('first', DataDefinition.create('string'));
    def.setPropertyDefinition('last', DataDefinition.create('string'));
    return def;
  };

  it('gets/sets named properties as typed data', () => {
    const m = manager();
    const map = m.create(buildDef(), { first: 'Ada', last: 'Lovelace' }) as ComplexDataInterface;
    expect(map.get('first').getValue()).toBe('Ada');
    expect(map.get('last').getValue()).toBe('Lovelace');
  });

  it('set() updates a property and returns this', () => {
    const m = manager();
    const map = m.create(buildDef()) as ComplexDataInterface;
    expect(map.set('first', 'Grace')).toBe(map);
    expect(map.get('first').getValue()).toBe('Grace');
  });

  it('getValue reflects the assembled property values', () => {
    const m = manager();
    const map = m.create(buildDef(), { first: 'Ada', last: 'Lovelace' }) as ComplexDataInterface;
    expect(map.getValue()).toEqual({ first: 'Ada', last: 'Lovelace' });
  });

  it('getProperties returns all defined properties keyed by name', () => {
    const m = manager();
    const map = m.create(buildDef(), { first: 'Ada' }) as ComplexDataInterface;
    expect(Object.keys(map.getProperties())).toEqual(['first', 'last']);
  });

  it('isEmpty reflects whether any property has a value', () => {
    const m = manager();
    const empty = m.create(buildDef()) as ComplexDataInterface;
    expect(empty.isEmpty()).toBe(true);
    const full = m.create(buildDef(), { first: 'Ada' }) as ComplexDataInterface;
    expect(full.isEmpty()).toBe(false);
  });

  it('throws on a non-array value', () => {
    const m = manager();
    const map = m.create(buildDef()) as ComplexDataInterface;
    expect(() => map.setValue('nope')).toThrow(/associative array/);
  });

  it('is iterable over its properties', () => {
    const m = manager();
    const map = m.create(buildDef(), { first: 'Ada', last: 'L' }) as ComplexDataInterface;
    const values = [...map].map((p) => p.getValue());
    expect(values).toEqual(['Ada', 'L']);
  });

  it('reports property paths for child properties', () => {
    const m = manager();
    const map = m.create(buildDef(), { first: 'Ada' }) as ComplexDataInterface;
    expect(map.get('first').getPropertyPath()).toBe('first');
  });
});

describe('ItemList (list of items)', () => {
  const listDef = (): ListDataDefinition => ListDataDefinition.create('string');

  it('appends and reads items by index', () => {
    const m = manager();
    const list = m.create(listDef()) as ListInterface;
    list.appendItem('a');
    list.appendItem('b');
    expect(list.count()).toBe(2);
    expect(list.get(0)?.getValue()).toBe('a');
    expect(list.get(1)?.getValue()).toBe('b');
  });

  it('setValue replaces all items', () => {
    const m = manager();
    const list = m.create(listDef(), ['x', 'y', 'z']) as ListInterface;
    expect(list.count()).toBe(3);
    expect(list.getValue()).toEqual(['x', 'y', 'z']);
  });

  it('first() and last() return boundary items', () => {
    const m = manager();
    const list = m.create(listDef(), ['x', 'y', 'z']) as ListInterface;
    expect(list.first()?.getValue()).toBe('x');
    expect(list.last()?.getValue()).toBe('z');
  });

  it('set() at the next index appends', () => {
    const m = manager();
    const list = m.create(listDef(), ['x']) as ListInterface;
    list.set(1, 'y');
    expect(list.getValue()).toEqual(['x', 'y']);
  });

  it('set() at a non-subsequent delta throws', () => {
    const m = manager();
    const list = m.create(listDef(), ['x']) as ListInterface;
    expect(() => list.set(5, 'z')).toThrow(/non-subsequent/);
  });

  it('get() with a non-numeric delta throws', () => {
    const m = manager();
    const list = m.create(listDef()) as ListInterface;
    expect(() => list.get('a' as unknown as number)).toThrow(/non-numeric/);
  });

  it('removeItem rekeys remaining items', () => {
    const m = manager();
    const list = m.create(listDef(), ['a', 'b', 'c']) as ListInterface;
    list.removeItem(1);
    expect(list.getValue()).toEqual(['a', 'c']);
    expect(list.get(1)?.getName()).toBe(1);
  });

  it('filter keeps only matching items and rekeys', () => {
    const m = manager();
    const list = m.create(listDef(), ['keep', 'drop', 'keep']) as ListInterface;
    list.filter((item) => item.getValue() === 'keep');
    expect(list.getValue()).toEqual(['keep', 'keep']);
  });

  it('isEmpty reflects content', () => {
    const m = manager();
    expect((m.create(listDef()) as ListInterface).isEmpty()).toBe(true);
    expect((m.create(listDef(), ['a']) as ListInterface).isEmpty()).toBe(false);
  });

  it('is iterable over items', () => {
    const m = manager();
    const list = m.create(listDef(), ['a', 'b']) as ListInterface;
    expect([...list].map((i) => i.getValue())).toEqual(['a', 'b']);
  });

  it('child items expose dotted property paths', () => {
    const m = manager();
    const list = m.create(listDef(), ['a'], 'tags') as ListInterface;
    expect(list.get(0)?.getPropertyPath()).toBe('tags.0');
  });
});

describe('Constraint hook point', () => {
  it('validate returns empty when no required constraint is violated', () => {
    const m = manager();
    const data = m.create(DataDefinition.create('string'), 'hi');
    expect(data.validate()).toEqual([]);
  });

  it('validate flags a required value that is null', () => {
    const m = manager();
    const def = DataDefinition.create('string').setRequired(true);
    const data = m.create(def);
    const violations = data.validate();
    expect(violations).toHaveLength(1);
    expect(violations[0]?.constraint).toBe('NotNull');
  });
});
