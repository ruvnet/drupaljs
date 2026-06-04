import { beforeEach, describe, expect, it } from 'vitest';
import { PluginNotFoundException } from '@drupaljs/plugin';
import { FieldTypePluginManager } from './field-type-plugin-manager.js';
import { FieldItemList } from './field-item-list.js';
import { StringItem } from '../__fixtures__/text-field.js';
import type { FieldableEntityInterface } from '../contracts.js';

const entity: FieldableEntityInterface = {
  getEntityTypeId: () => 'node',
  bundle: () => 'article',
};

describe('FieldTypePluginManager', () => {
  let manager: FieldTypePluginManager;

  beforeEach(() => {
    manager = new FieldTypePluginManager();
    manager.setDefinition('string', {
      label: 'Text (plain)',
      class: StringItem,
      default_widget: 'string_textfield',
      default_formatter: 'string',
      category: 'text',
    });
  });

  it('registers and resolves a field type plugin', () => {
    expect(manager.hasDefinition('string')).toBe(true);
    expect(manager.getDefinition('string')?.label).toBe('Text (plain)');
    expect(manager.getPluginClass('string')).toBe(StringItem);
  });

  it('throws PluginNotFoundException for an unknown field type', () => {
    expect(() => manager.getPluginClass('nope')).toThrow(PluginNotFoundException);
    expect(manager.getDefinition('nope', false)).toBeNull();
  });

  it('reads default storage and field settings from the item class', () => {
    expect(manager.getDefaultStorageSettings('string')).toEqual({ max_length: 255 });
    expect(manager.getDefaultFieldSettings('string')).toEqual({ case_sensitive: false });
  });

  it('builds storage and field definitions wired to the item class', () => {
    const storage = manager.createFieldStorageDefinition('field_x', 'string', 'node', {
      cardinality: 2,
    });
    expect(storage.getPropertyNames()).toEqual(['value']);
    expect(storage.getCardinality()).toBe(2);

    const definition = manager.createFieldDefinition(storage, 'article', { required: true });
    expect(definition.getName()).toBe('field_x');
    expect(definition.isRequired()).toBe(true);
    expect(definition.getTargetBundle()).toBe('article');
  });

  it('creates a field item list bound to an entity with initial values', () => {
    const storage = manager.createFieldStorageDefinition('field_x', 'string', 'node');
    const definition = manager.createFieldDefinition(storage, 'article');
    const list = manager.createFieldItemList(definition, entity, [{ value: 'a' }, { value: 'b' }]);
    expect(list).toBeInstanceOf(FieldItemList);
    expect(list.getEntity()).toBe(entity);
    expect(list.count()).toBe(2);
    expect(list.value).toBe('a');
  });

  it('creates a field item within an existing list', () => {
    const storage = manager.createFieldStorageDefinition('field_x', 'string', 'node');
    const definition = manager.createFieldDefinition(storage);
    const list = manager.createFieldItemList(definition, entity);
    const item = manager.createFieldItem(list, 0, { value: 'z' });
    expect(item.get('value').getValue()).toBe('z');
    expect(list.count()).toBe(1);
  });

  it('excludes no_ui field types from UI definitions', () => {
    manager.setDefinition('hidden_type', { label: 'Hidden', class: StringItem, no_ui: true });
    const ui = manager.getUiDefinitions();
    expect(ui).toHaveProperty('string');
    expect(ui).not.toHaveProperty('hidden_type');
  });
});
