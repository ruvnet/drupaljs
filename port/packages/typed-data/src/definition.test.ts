import { describe, it, expect } from 'vitest';
import { DataDefinition } from './definition.js';
import { ListDataDefinition } from './list-definition.js';
import { MapDataDefinition } from './map-definition.js';

describe('DataDefinition', () => {
  it('defaults the data type to "any"', () => {
    expect(new DataDefinition().getDataType()).toBe('any');
  });

  it('creates from a data type via the static factory', () => {
    const def = DataDefinition.create('string');
    expect(def.getDataType()).toBe('string');
    expect(def.isList()).toBe(false);
  });

  it('createFromDataType is equivalent to create', () => {
    expect(DataDefinition.createFromDataType('integer').getDataType()).toBe('integer');
  });

  it('supports fluent label/description setters', () => {
    const def = DataDefinition.create('string').setLabel('Title').setDescription('A title');
    expect(def.getLabel()).toBe('Title');
    expect(def.getDescription()).toBe('A title');
  });

  it('returns null label/description by default', () => {
    const def = DataDefinition.create('string');
    expect(def.getLabel()).toBeNull();
    expect(def.getDescription()).toBeNull();
  });

  it('tracks required/computed/read-only flags', () => {
    const def = DataDefinition.create('string');
    expect(def.isRequired()).toBe(false);
    expect(def.isComputed()).toBe(false);
    def.setRequired(true).setComputed(true);
    expect(def.isRequired()).toBe(true);
    expect(def.isComputed()).toBe(true);
  });

  it('defaults read-only to the computed flag when unset', () => {
    const def = DataDefinition.create('string').setComputed(true);
    expect(def.isReadOnly()).toBe(true);
  });

  it('respects an explicit read-only flag over computed default', () => {
    const def = DataDefinition.create('string').setComputed(true).setReadOnly(false);
    expect(def.isReadOnly()).toBe(false);
  });

  it('defaults isInternal to the computed flag when unset', () => {
    expect(DataDefinition.create('string').setComputed(true).isInternal()).toBe(true);
    expect(DataDefinition.create('string').isInternal()).toBe(false);
  });

  it('stores and reads settings', () => {
    const def = DataDefinition.create('string').setSetting('max', 10);
    expect(def.getSetting('max')).toBe(10);
    expect(def.getSetting('missing')).toBeNull();
    expect(def.getSettings()).toEqual({ max: 10 });
  });

  it('adds and reads constraints', () => {
    const def = DataDefinition.create('string')
      .addConstraint('Length', { max: 5 })
      .addConstraint('NotBlank');
    expect(def.getConstraint('Length')).toEqual({ max: 5 });
    expect(def.getConstraint('NotBlank')).toBeNull();
    expect(def.getConstraints()).toEqual({ Length: { max: 5 }, NotBlank: null });
  });

  it('exposes a class id override', () => {
    expect(DataDefinition.create('string').getClass()).toBeNull();
    expect(DataDefinition.create('string').setClass('custom').getClass()).toBe('custom');
  });

  it('round-trips through toArray', () => {
    const def = DataDefinition.create('string').setLabel('X');
    expect(def.toArray()).toEqual({ type: 'string', label: 'X' });
  });
});

describe('ListDataDefinition', () => {
  it('reports isList true and data type "list"', () => {
    const def = ListDataDefinition.create('string');
    expect(def.isList()).toBe(true);
    expect(def.getDataType()).toBe('list');
  });

  it('exposes the item definition built from the item type', () => {
    const def = ListDataDefinition.create('string');
    expect(def.getItemDefinition().getDataType()).toBe('string');
  });

  it('createFromItemType builds a list of that item type', () => {
    const def = ListDataDefinition.createFromItemType('integer');
    expect(def.getItemDefinition().getDataType()).toBe('integer');
  });
});

describe('MapDataDefinition', () => {
  it('has data type "map" and is complex', () => {
    const def = MapDataDefinition.create();
    expect(def.getDataType()).toBe('map');
    expect(def.isList()).toBe(false);
  });

  it('stores and retrieves property definitions', () => {
    const def = MapDataDefinition.create();
    def.setPropertyDefinition('value', DataDefinition.create('string'));
    expect(def.getPropertyDefinition('value')?.getDataType()).toBe('string');
    expect(def.getPropertyDefinition('missing')).toBeNull();
    expect(Object.keys(def.getPropertyDefinitions())).toEqual(['value']);
  });

  it('returns null main property name by default', () => {
    expect(MapDataDefinition.create().getMainPropertyName()).toBeNull();
  });
});
