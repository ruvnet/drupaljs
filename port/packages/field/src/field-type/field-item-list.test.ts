import { beforeEach, describe, expect, it } from 'vitest';
import { FieldStorageDefinition } from '../field-storage-definition.js';
import { FieldDefinition } from '../field-definition.js';
import { FieldItemList } from './field-item-list.js';
import { StringItem } from '../__fixtures__/text-field.js';
import type { FieldDefinitionInterface, FieldableEntityInterface } from '../contracts.js';

const entity: FieldableEntityInterface = {
  getEntityTypeId: () => 'node',
  bundle: () => 'article',
};

function makeDefinition(cardinality = 1): FieldDefinitionInterface {
  const storage = new FieldStorageDefinition({
    name: 'field_tags',
    type: 'string',
    entityTypeId: 'node',
    itemClass: StringItem,
    cardinality,
  });
  return FieldDefinition.createFromStorageDefinition(storage, { bundle: 'article' });
}

describe('FieldItemList', () => {
  let list: FieldItemList;

  beforeEach(() => {
    list = new FieldItemList(makeDefinition(3), StringItem, 'field_tags', entity);
  });

  it('starts empty and exposes its field definition and entity', () => {
    expect(list.count()).toBe(0);
    expect(list.isEmpty()).toBe(true);
    expect(list.getFieldDefinition().getName()).toBe('field_tags');
    expect(list.getEntity()).toBe(entity);
  });

  it('sets a list of values, creating items per delta', () => {
    list.setValue([{ value: 'a' }, { value: 'b' }]);
    expect(list.count()).toBe(2);
    expect(list.get(0)?.get('value').getValue()).toBe('a');
    expect(list.get(1)?.get('value').getValue()).toBe('b');
    expect(list.getValue()).toEqual([{ value: 'a' }, { value: 'b' }]);
  });

  it('coerces a single scalar into a single item', () => {
    list.setValue('solo');
    expect(list.count()).toBe(1);
    expect(list.get(0)?.get('value').getValue()).toBe('solo');
  });

  it('delegates the value accessor to the first item main property', () => {
    list.setValue([{ value: 'first' }, { value: 'second' }]);
    expect(list.value).toBe('first');
  });

  it('returns null for the value of an empty list', () => {
    expect(list.value).toBeNull();
  });

  it('appends and removes items, re-keying deltas', () => {
    list.appendItem('one');
    list.appendItem('two');
    list.appendItem('three');
    expect(list.count()).toBe(3);
    list.removeItem(1);
    expect(list.count()).toBe(2);
    expect(list.get(0)?.getString()).toBe('one');
    expect(list.get(1)?.getString()).toBe('three');
    expect(list.get(1)?.getName()).toBe(1);
  });

  it('filters out empty items via filterEmptyItems()', () => {
    list.setValue([{ value: 'keep' }, { value: '' }, { value: 'also' }]);
    list.filterEmptyItems();
    expect(list.count()).toBe(2);
    expect(list.getValue()).toEqual([{ value: 'keep' }, { value: 'also' }]);
  });

  it('is iterable over its items', () => {
    list.setValue([{ value: 'a' }, { value: 'b' }]);
    const values = [...list].map((item) => item.getString());
    expect(values).toEqual(['a', 'b']);
  });

  it('compares equality by value', () => {
    const a = new FieldItemList(makeDefinition(3), StringItem, 'field_tags');
    const b = new FieldItemList(makeDefinition(3), StringItem, 'field_tags');
    a.setValue([{ value: 'x' }]);
    b.setValue([{ value: 'x' }]);
    expect(a.equals(b)).toBe(true);
    b.setValue([{ value: 'y' }]);
    expect(a.equals(b)).toBe(false);
  });

  it('applies the default value literal', () => {
    const def = FieldDefinition.createFromStorageDefinition(
      new FieldStorageDefinition({
        name: 'field_tags',
        type: 'string',
        entityTypeId: 'node',
        itemClass: StringItem,
      }),
      { defaultValue: [{ value: 'default' }] },
    );
    const defaulted = new FieldItemList(def, StringItem, 'field_tags');
    defaulted.applyDefaultValue();
    expect(defaulted.get(0)?.get('value').getValue()).toBe('default');
  });

  it('manages langcode', () => {
    list.setLangcode('en');
    expect(list.getLangcode()).toBe('en');
  });

  it('reports a renderable view and a default-allowed access result', () => {
    expect(list.view()).toEqual({});
    expect(list.defaultAccess().isAllowed()).toBe(true);
  });
});
