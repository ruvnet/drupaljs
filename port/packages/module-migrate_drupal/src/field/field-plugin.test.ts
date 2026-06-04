import { describe, it, expect } from 'vitest';
import { FieldPluginBase } from './field-plugin-base.js';
import { NodeReference, USER_REFERENCE_D7 } from './reference.js';
import type { MigrateFieldDefinition, RowLike } from '../contracts.js';

function row(source: Record<string, unknown>): RowLike {
  return {
    getSourceProperty: (p) => source[p],
    getDestinationProperty: (p) => source[p],
  };
}

const baseDef: MigrateFieldDefinition = {
  id: 'sample',
  core: [6, 7],
  type_map: { text_long: 'text_long', mytype: 'string_long' },
  source_module: 'text',
  destination_module: 'text',
};

describe('FieldPluginBase.getFieldType', () => {
  const plugin = new FieldPluginBase('sample', baseDef);

  it('maps the source type through type_map', () => {
    expect(plugin.getFieldType(row({ type: 'mytype' }))).toBe('string_long');
  });

  it('returns the source type unchanged when absent from type_map', () => {
    expect(plugin.getFieldType(row({ type: 'unmapped' }))).toBe('unmapped');
  });
});

describe('FieldPluginBase widget/formatter defaults', () => {
  const plugin = new FieldPluginBase('myplugin', { ...baseDef, id: 'myplugin' });

  it('reads widget type from widget/type', () => {
    expect(plugin.getFieldWidgetType(row({ 'widget/type': 'text_textfield' }))).toBe(
      'text_textfield',
    );
  });

  it('reads formatter type from formatter/type', () => {
    expect(
      plugin.getFieldFormatterType(row({ 'formatter/type': 'text_default' })),
    ).toBe('text_default');
  });

  it('default widget map maps the plugin id to "<id>_default"', () => {
    expect(plugin.getFieldWidgetMap()).toEqual({ myplugin: 'myplugin_default' });
  });

  it('default formatter map is empty', () => {
    expect(plugin.getFieldFormatterMap()).toEqual({});
  });

  it('exposes plugin id and definition', () => {
    expect(plugin.getPluginId()).toBe('myplugin');
    expect(plugin.getPluginDefinition().source_module).toBe('text');
  });
});

describe('NodeReference (d6) field plugin', () => {
  const plugin = new NodeReference();

  it('maps nodereference -> entity_reference', () => {
    expect(plugin.getPluginId()).toBe('nodereference');
    expect(plugin.getFieldType(row({ type: 'nodereference' }))).toBe(
      'entity_reference',
    );
  });

  it('declares core 6 and source module nodereference', () => {
    const def = plugin.getPluginDefinition();
    expect(def.core).toEqual([6]);
    expect(def.source_module).toBe('nodereference');
    expect(def.destination_module).toBe('core');
  });
});

describe('UserReference (d7) field plugin', () => {
  it('maps userreference -> entity_reference for core 7', () => {
    expect(USER_REFERENCE_D7.getFieldType(row({ type: 'userreference' }))).toBe(
      'entity_reference',
    );
    expect(USER_REFERENCE_D7.getPluginDefinition().core).toEqual([7]);
  });
});
