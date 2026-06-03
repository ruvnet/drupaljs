import { describe, expect, it } from 'vitest';
import { FieldDefinition } from './field-definition.js';
import { FieldStorageDefinition } from './field-storage-definition.js';
import { FieldException } from './exception.js';
import { StringItem } from './__fixtures__/text-field.js';
import type { FieldableEntityInterface } from './contracts.js';

const entity: FieldableEntityInterface = {
  getEntityTypeId: () => 'node',
  bundle: () => 'article',
};

function makeStorage(overrides = {}) {
  return new FieldStorageDefinition({
    name: 'field_summary',
    type: 'string',
    entityTypeId: 'node',
    itemClass: StringItem,
    label: 'Summary',
    settings: { max_length: 100 },
    ...overrides,
  });
}

describe('FieldDefinition', () => {
  it('throws when constructed without a storage definition', () => {
    // @ts-expect-error deliberately missing storageDefinition
    expect(() => new FieldDefinition({})).toThrow(FieldException);
  });

  it('delegates name and type to the storage definition', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), { bundle: 'article' });
    expect(def.getName()).toBe('field_summary');
    expect(def.getType()).toBe('string');
    expect(def.getTargetEntityTypeId()).toBe('node');
    expect(def.getTargetBundle()).toBe('article');
  });

  it('is a typed-data list definition (a field is a list of items)', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage());
    expect(def.isList()).toBe(true);
    expect(def.getDataType()).toBe('list');
    expect(def.getItemDefinition().getDataType()).toBe('field_item:string');
  });

  it('falls back to the storage label/description but allows overrides', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage());
    expect(def.getLabel()).toBe('Summary');
    const overridden = FieldDefinition.createFromStorageDefinition(makeStorage(), {
      label: 'Custom',
      description: 'A custom field.',
    });
    expect(overridden.getLabel()).toBe('Custom');
    expect(overridden.getDescription()).toBe('A custom field.');
  });

  it('merges field settings over storage settings', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), {
      settings: { case_sensitive: true },
    });
    expect(def.getSetting('max_length')).toBe(100); // from storage
    expect(def.getSetting('case_sensitive')).toBe(true); // field-level
  });

  it('reports required and translatable flags', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), { required: true });
    expect(def.isRequired()).toBe(true);
    expect(def.isTranslatable()).toBe(false); // inherits storage default
    const translatable = FieldDefinition.createFromStorageDefinition(
      makeStorage({ translatable: true }),
    );
    expect(translatable.isTranslatable()).toBe(true);
  });

  it('returns default value literal and computes default value', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), {
      defaultValue: [{ value: 'hi' }],
    });
    expect(def.getDefaultValueLiteral()).toEqual([{ value: 'hi' }]);
    expect(def.getDefaultValue(entity)).toEqual([{ value: 'hi' }]);
    expect(FieldDefinition.createFromStorageDefinition(makeStorage()).getDefaultValueLiteral()).toEqual([]);
  });

  it('builds a unique identifier including the bundle', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), { bundle: 'article' });
    expect(def.getUniqueIdentifier()).toBe('node-field_summary-article');
  });

  it('exposes display configuration per context', () => {
    const def = FieldDefinition.createFromStorageDefinition(makeStorage(), {
      displayConfigurable: { view: true },
      displayOptions: { view: { type: 'string', weight: 5 } },
    });
    expect(def.isDisplayConfigurable('view')).toBe(true);
    expect(def.isDisplayConfigurable('form')).toBe(false);
    expect(def.getDisplayOptions('view')).toEqual({ type: 'string', weight: 5 });
    expect(def.getDisplayOptions('form')).toBeNull();
  });
});
