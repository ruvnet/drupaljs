import { beforeEach, describe, expect, it } from 'vitest';
import { PluginNotFoundException } from '@drupaljs/plugin';
import { WidgetPluginManager } from './widget-plugin-manager.js';
import { FieldStorageDefinition } from '../field-storage-definition.js';
import { FieldDefinition } from '../field-definition.js';
import { FieldItemList } from '../field-type/field-item-list.js';
import { StringItem, StringTextfieldWidget } from '../__fixtures__/text-field.js';
import type { FieldDefinitionInterface } from '../contracts.js';

function makeDefinition(): FieldDefinitionInterface {
  const storage = new FieldStorageDefinition({
    name: 'field_summary',
    type: 'string',
    entityTypeId: 'node',
    itemClass: StringItem,
  });
  return FieldDefinition.createFromStorageDefinition(storage, { bundle: 'article' });
}

describe('WidgetPluginManager', () => {
  let manager: WidgetPluginManager;
  let definition: FieldDefinitionInterface;

  beforeEach(() => {
    manager = new WidgetPluginManager();
    manager.setDefinition('string_textfield', {
      label: 'Textfield',
      class: StringTextfieldWidget,
      field_types: ['string'],
    });
    definition = makeDefinition();
  });

  it('filters widget options by field type', () => {
    expect(Object.keys(manager.getOptions('string'))).toEqual(['string_textfield']);
    expect(Object.keys(manager.getOptions('integer'))).toEqual([]);
  });

  it('throws for an unknown widget id', () => {
    expect(() => manager.createInstance('nope', { fieldDefinition: definition })).toThrow(
      PluginNotFoundException,
    );
  });

  it('instantiates a widget with merged default settings', () => {
    const widget = manager.createInstance('string_textfield', { fieldDefinition: definition });
    expect(widget.getPluginId()).toBe('string_textfield');
    expect(widget.getSetting('size')).toBe(60);
  });

  it('builds a per-delta form element', () => {
    const widget = manager.createInstance('string_textfield', { fieldDefinition: definition });
    const list = new FieldItemList(definition, StringItem, 'field_summary');
    list.setValue([{ value: 'hello' }]);
    const element = widget.formElement(list, 0, { '#title': 'Summary' });
    expect(element['#type']).toBe('textfield');
    expect(element['#title']).toBe('Summary');
    expect(element['#size']).toBe(60);
    expect(element['#default_value']).toBe('hello');
  });

  it('passes submitted values through massageFormValues by default', () => {
    const widget = manager.createInstance('string_textfield', { fieldDefinition: definition });
    const values = [{ value: 'a' }, { value: 'b' }];
    expect(widget.massageFormValues(values)).toEqual(values);
  });
});
