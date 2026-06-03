import { describe, expect, it } from 'vitest';
import { FieldStorageDefinition } from './field-storage-definition.js';
import { FieldException } from './exception.js';
import { CARDINALITY_UNLIMITED } from './contracts.js';
import { StringItem } from './__fixtures__/text-field.js';

function makeStorage(overrides = {}) {
  return new FieldStorageDefinition({
    name: 'field_summary',
    type: 'string',
    entityTypeId: 'node',
    itemClass: StringItem,
    ...overrides,
  });
}

describe('FieldStorageDefinition', () => {
  it('exposes name, type, entity type and a unique storage identifier', () => {
    const storage = makeStorage();
    expect(storage.getName()).toBe('field_summary');
    expect(storage.getType()).toBe('string');
    expect(storage.getTargetEntityTypeId()).toBe('node');
    expect(storage.getUniqueStorageIdentifier()).toBe('node-field_summary');
  });

  it('throws a FieldException when required values are missing', () => {
    expect(() => makeStorage({ name: '' })).toThrow(FieldException);
    expect(() => makeStorage({ type: '' })).toThrow(FieldException);
  });

  it('merges field-type default storage settings under explicit settings', () => {
    const storage = makeStorage({ settings: { max_length: 100 } });
    expect(storage.getSettings()).toEqual({ max_length: 100 });
    expect(storage.getSetting('max_length')).toBe(100);
    // Default applies when not overridden.
    expect(makeStorage().getSetting('max_length')).toBe(255);
  });

  it('derives property definitions and names from the field item class', () => {
    const storage = makeStorage();
    expect(storage.getPropertyNames()).toEqual(['value']);
    expect(storage.getMainPropertyName()).toBe('value');
    expect(storage.getPropertyDefinition('value')?.getDataType()).toBe('string');
    expect(storage.getPropertyDefinition('missing')).toBeNull();
  });

  it('derives schema and columns from the field item class', () => {
    const storage = makeStorage();
    expect(storage.getColumns()).toEqual({ value: { type: 'varchar', length: 255 } });
    expect(storage.getSchema()).toHaveProperty('columns.value.type', 'varchar');
  });

  it('reports cardinality and multiplicity', () => {
    expect(makeStorage().getCardinality()).toBe(1);
    expect(makeStorage().isMultiple()).toBe(false);
    expect(makeStorage({ cardinality: 3 }).isMultiple()).toBe(true);
    expect(makeStorage({ cardinality: CARDINALITY_UNLIMITED }).isMultiple()).toBe(true);
  });

  it('supports toggling translatability fluently', () => {
    const storage = makeStorage();
    expect(storage.isTranslatable()).toBe(false);
    expect(storage.setTranslatable(true)).toBe(storage);
    expect(storage.isTranslatable()).toBe(true);
  });

  it('defaults to a base field and reports deleted/custom-storage flags', () => {
    expect(makeStorage().isBaseField()).toBe(true);
    expect(makeStorage().isDeleted()).toBe(false);
    expect(makeStorage().hasCustomStorage()).toBe(false);
    expect(makeStorage({ baseField: false, deleted: true, customStorage: true }).isBaseField()).toBe(false);
  });
});
