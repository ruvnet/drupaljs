import { describe, it, expect } from 'vitest';
import { TypedDataManager } from './manager.js';
import { DataDefinition } from './definition.js';
import { ListDataDefinition } from './list-definition.js';
import { MapDataDefinition } from './map-definition.js';
import type { ComplexDataInterface, ListInterface, PrimitiveInterface } from './contracts.js';

const manager = (): TypedDataManager => new TypedDataManager();

describe('TypedDataManager — registry', () => {
  it('registers the core data types out of the box', () => {
    const m = manager();
    for (const id of ['any', 'string', 'integer', 'float', 'boolean', 'list', 'map']) {
      expect(m.hasDefinition(id)).toBe(true);
    }
  });

  it('throws when creating an instance for an unknown data type', () => {
    const m = manager();
    const def = DataDefinition.create('does-not-exist');
    expect(() => m.create(def)).toThrow(/Invalid data type/);
  });

  it('createDataDefinition uses the type-specific definition class', () => {
    const m = manager();
    expect(m.createDataDefinition('map')).toBeInstanceOf(MapDataDefinition);
    expect(m.createDataDefinition('list')).toBeInstanceOf(ListDataDefinition);
  });

  it('createListDataDefinition wraps an item type', () => {
    const m = manager();
    const def = m.createListDataDefinition('string');
    expect(def.getItemDefinition().getDataType()).toBe('string');
  });
});

describe('TypedDataManager — create primitives', () => {
  it('creates a string and casts the value', () => {
    const m = manager();
    const data = m.create(DataDefinition.create('string'), 123) as PrimitiveInterface;
    expect(data.getValue()).toBe(123);
    expect(data.getCastedValue()).toBe('123');
    expect(data.getString()).toBe('123');
  });

  it('casts integers and floats and booleans', () => {
    const m = manager();
    expect((m.create(DataDefinition.create('integer'), '42') as PrimitiveInterface).getCastedValue()).toBe(42);
    expect((m.create(DataDefinition.create('float'), '3.5') as PrimitiveInterface).getCastedValue()).toBe(3.5);
    expect((m.create(DataDefinition.create('boolean'), 1) as PrimitiveInterface).getCastedValue()).toBe(true);
    expect((m.create(DataDefinition.create('boolean'), 0) as PrimitiveInterface).getCastedValue()).toBe(false);
  });

  it('returns the data definition on the created object', () => {
    const m = manager();
    const def = DataDefinition.create('string');
    expect(m.create(def).getDataDefinition()).toBe(def);
  });
});

describe('TypedDataManager — getString on null', () => {
  it('renders null as empty string', () => {
    const m = manager();
    expect(m.create(DataDefinition.create('string')).getString()).toBe('');
  });
});
