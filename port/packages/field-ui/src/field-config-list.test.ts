import { describe, it, expect } from 'vitest';
import { FieldConfigListBuilder } from './field-config-list.js';
import type { DisplayContext, FieldDefinitionInterface } from './types.js';

function field(
  name: string,
  type: string,
  label: string,
  configurable: DisplayContext[] = ['view', 'form'],
): FieldDefinitionInterface {
  return {
    getName: () => name,
    getType: () => type,
    getLabel: () => label,
    isDisplayConfigurable: (ctx) => configurable.includes(ctx),
  };
}

describe('FieldConfigListBuilder.buildRows', () => {
  it('builds one row per field with name, type and label', () => {
    const builder = new FieldConfigListBuilder();
    const rows = builder.buildRows([
      field('body', 'text_long', 'Body'),
      field('title', 'string', 'Title'),
    ]);

    expect(rows).toEqual([
      { fieldName: 'body', type: 'text_long', label: 'Body' },
      { fieldName: 'title', type: 'string', label: 'Title' },
    ]);
  });

  it('sorts rows alphabetically by label (case-insensitive)', () => {
    const builder = new FieldConfigListBuilder();
    const rows = builder.buildRows([
      field('z', 'string', 'Zebra'),
      field('a', 'string', 'apple'),
      field('b', 'string', 'Banana'),
    ]);

    expect(rows.map((r) => r.fieldName)).toEqual(['a', 'b', 'z']);
  });
});

describe('FieldConfigListBuilder.filterConfigurable', () => {
  it('keeps only fields configurable in the requested context', () => {
    const builder = new FieldConfigListBuilder();
    const fields = [
      field('viewable', 'string', 'V', ['view']),
      field('formable', 'string', 'F', ['form']),
      field('both', 'string', 'B', ['view', 'form']),
    ];

    expect(builder.filterConfigurable(fields, 'view').map((f) => f.getName())).toEqual([
      'viewable',
      'both',
    ]);
  });
});
