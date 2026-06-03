import { beforeEach, describe, expect, it } from 'vitest';
import { PluginNotFoundException } from '@drupaljs/plugin';
import { FormatterPluginManager } from './formatter-plugin-manager.js';
import { FieldStorageDefinition } from '../field-storage-definition.js';
import { FieldDefinition } from '../field-definition.js';
import { FieldItemList } from '../field-type/field-item-list.js';
import { StringItem, StringFormatter } from '../__fixtures__/text-field.js';
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

describe('FormatterPluginManager', () => {
  let manager: FormatterPluginManager;
  let definition: FieldDefinitionInterface;

  beforeEach(() => {
    manager = new FormatterPluginManager();
    manager.setDefinition('string', {
      label: 'Plain text',
      class: StringFormatter,
      field_types: ['string'],
    });
    manager.setDefinition('boolean', {
      label: 'Boolean',
      class: StringFormatter,
      field_types: ['boolean'],
    });
    definition = makeDefinition();
  });

  it('filters formatter options by field type', () => {
    const options = manager.getOptions('string');
    expect(Object.keys(options)).toEqual(['string']);
  });

  it('throws for an unknown formatter id', () => {
    expect(() => manager.createInstance('nope', { fieldDefinition: definition })).toThrow(
      PluginNotFoundException,
    );
  });

  it('instantiates a formatter with merged default settings', () => {
    const formatter = manager.createInstance('string', { fieldDefinition: definition });
    expect(formatter.getPluginId()).toBe('string');
    expect(formatter.getSetting('trim_length')).toBe(0); // from defaultSettings()
  });

  it('renders field items through view()/viewElements()', () => {
    const formatter = manager.createInstance('string', { fieldDefinition: definition });
    const list = new FieldItemList(definition, StringItem, 'field_summary');
    list.setValue([{ value: 'one' }, { value: 'two' }]);
    const render = formatter.view(list, 'en');
    expect(render['#field_name']).toBe('field_summary');
    expect(render[0]).toEqual({ '#markup': 'one' });
    expect(render[1]).toEqual({ '#markup': 'two' });
  });

  it('honors instance settings overriding defaults', () => {
    const formatter = manager.createInstance('string', {
      fieldDefinition: definition,
      settings: { trim_length: 50 },
    });
    expect(formatter.getSetting('trim_length')).toBe(50);
  });

  it('reports applicability via the static isApplicable()', () => {
    expect(StringFormatter.isApplicable(definition)).toBe(true);
  });
});
