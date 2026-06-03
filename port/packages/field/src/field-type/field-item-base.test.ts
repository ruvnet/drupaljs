import { beforeEach, describe, expect, it } from 'vitest';
import { FieldStorageDefinition } from '../field-storage-definition.js';
import { FieldDefinition } from '../field-definition.js';
import { FieldItemList } from './field-item-list.js';
import { StringItem } from '../__fixtures__/text-field.js';
import type { FieldDefinitionInterface, FieldItemInterface } from '../contracts.js';

function makeDefinition(): FieldDefinitionInterface {
  const storage = new FieldStorageDefinition({
    name: 'field_summary',
    type: 'string',
    entityTypeId: 'node',
    itemClass: StringItem,
  });
  return FieldDefinition.createFromStorageDefinition(storage, { bundle: 'article' });
}

describe('FieldItemBase (FieldType)', () => {
  let list: FieldItemList;
  let item: FieldItemInterface;

  beforeEach(() => {
    const definition = makeDefinition();
    list = new FieldItemList(definition, StringItem, 'field_summary');
    item = list.appendItem();
  });

  it('assigns a scalar to the main property', () => {
    item.setValue('hello');
    expect(item.get('value').getValue()).toBe('hello');
    expect(item.getValue()).toEqual({ value: 'hello' });
    expect(item.getString()).toBe('hello');
  });

  it('accepts an object of property values', () => {
    item.setValue({ value: 'world' });
    expect(item.get('value').getValue()).toBe('world');
  });

  it('reports emptiness based on the main property', () => {
    expect(item.isEmpty()).toBe(true);
    item.setValue('x');
    expect(item.isEmpty()).toBe(false);
    item.setValue('');
    expect(item.isEmpty()).toBe(true);
  });

  it('sets individual properties through set()', () => {
    item.set('value', 'direct');
    expect(item.get('value').getValue()).toBe('direct');
  });

  it('exposes the declared properties via getProperties()', () => {
    expect(Object.keys(item.getProperties())).toEqual(['value']);
  });

  it('reaches its field definition through the parent list', () => {
    expect(item.getFieldDefinition().getName()).toBe('field_summary');
    expect(item.getSetting('max_length')).toBe(255);
  });

  it('resets to empty on applyDefaultValue', () => {
    item.setValue('something');
    item.applyDefaultValue();
    expect(item.isEmpty()).toBe(true);
  });

  it('exposes static field-type metadata', () => {
    expect(StringItem.mainPropertyName()).toBe('value');
    expect(StringItem.defaultStorageSettings()).toEqual({ max_length: 255 });
    expect(StringItem.defaultFieldSettings()).toEqual({ case_sensitive: false });
  });
});
