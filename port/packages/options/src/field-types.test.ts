import { describe, it, expect, vi } from 'vitest';
import {
  ListIntegerItem,
  ListStringItem,
  ListFloatItem,
} from './field-types.js';
import type { FieldStorageDefinition, ListStorageSettings } from './contracts.js';

function mockDefinition(settings: Partial<ListStorageSettings>): FieldStorageDefinition {
  const full: ListStorageSettings = {
    allowed_values: {},
    allowed_values_function: '',
    ...settings,
  };
  return {
    getSetting: vi.fn(<K extends keyof ListStorageSettings>(name: K) => full[name]),
    getTargetEntityTypeId: vi.fn(() => 'node'),
    getName: vi.fn(() => 'field_test'),
  };
}

describe('ListIntegerItem', () => {
  const t = new ListIntegerItem();

  it('has the list_integer plugin id', () => {
    expect(ListIntegerItem.pluginId).toBe('list_integer');
  });

  it('accepts integer keys and rejects non-integers', () => {
    expect(t.validateAllowedValue('-3')).toBeNull();
    expect(t.validateAllowedValue('0')).toBeNull();
    expect(t.validateAllowedValue('1.5')).toMatch(/integers/i);
    expect(t.validateAllowedValue('abc')).toMatch(/integers/i);
  });

  it('casts allowed value keys to numbers', () => {
    expect(t.castAllowedValue('42')).toBe(42);
  });

  it('schema column type is int', () => {
    expect(ListIntegerItem.schema().columns.value.type).toBe('int');
  });
});

describe('ListStringItem', () => {
  const t = new ListStringItem();

  it('has the list_string plugin id', () => {
    expect(ListStringItem.pluginId).toBe('list_string');
  });

  it('accepts keys up to 255 chars and rejects longer', () => {
    expect(t.validateAllowedValue('apple')).toBeNull();
    expect(t.validateAllowedValue('x'.repeat(255))).toBeNull();
    expect(t.validateAllowedValue('x'.repeat(256))).toMatch(/255/);
  });

  it('casts allowed value keys to strings', () => {
    expect(t.castAllowedValue(5)).toBe('5');
  });

  it('schema column type is varchar 255', () => {
    expect(ListStringItem.schema().columns.value.type).toBe('varchar');
    expect(ListStringItem.schema().columns.value.length).toBe(255);
  });
});

describe('ListFloatItem', () => {
  const t = new ListFloatItem();

  it('has the list_float plugin id', () => {
    expect(ListFloatItem.pluginId).toBe('list_float');
  });

  it('accepts numeric keys and rejects non-numeric', () => {
    expect(t.validateAllowedValue('.5')).toBeNull();
    expect(t.validateAllowedValue('-2.75')).toBeNull();
    expect(t.validateAllowedValue('apple')).toMatch(/integer or decimal/i);
  });

  it('casts allowed value keys to floats', () => {
    expect(t.castAllowedValue('.25')).toBe(0.25);
  });

  it('disambiguates float keys when extracting (.5 -> "0.5")', () => {
    const values = t.extractAllowedValues(['.5|Half', '1|One'], false);
    expect(values).toEqual({ '0.5': 'Half', '1': 'One' });
  });

  it('schema column type is float', () => {
    expect(ListFloatItem.schema().columns.value.type).toBe('float');
  });
});

describe('ListItemBase.extractAllowedValues', () => {
  const t = new ListStringItem();

  it('parses "key|label" lines', () => {
    expect(t.extractAllowedValues(['a|Apple', 'b|Banana'], false)).toEqual({
      a: 'Apple',
      b: 'Banana',
    });
  });

  it('uses the text as both key and value when valid and no pipe', () => {
    expect(t.extractAllowedValues(['apple', 'banana'], false)).toEqual({
      apple: 'apple',
      banana: 'banana',
    });
  });

  it('trims whitespace around explicit keys and labels', () => {
    expect(t.extractAllowedValues(['  a  |  Apple  '], false)).toEqual({ a: 'Apple' });
  });

  it('returns null when mixing generated and explicit keys', () => {
    const ti = new ListIntegerItem();
    // "1|One" is explicit; "free text" cannot be an int key, so with no data
    // it would need a generated key -> invalid mix.
    expect(ti.extractAllowedValues(['1|One', 'free text'], false)).toBeNull();
  });

  it('generates positional keys for integer fields when there is no data', () => {
    const ti = new ListIntegerItem();
    expect(ti.extractAllowedValues(['First', 'Second'], false)).toEqual({
      '0': 'First',
      '1': 'Second',
    });
  });

  it('returns null when data exists and a key cannot be derived', () => {
    const ti = new ListIntegerItem();
    expect(ti.extractAllowedValues(['Free text'], true)).toBeNull();
  });
});

describe('ListItemBase config (de)serialization', () => {
  const t = new ListIntegerItem();

  it('structures a key-value map into config entries with cast values', () => {
    expect(t.structureAllowedValues({ '1': 'One', '2': 'Two' })).toEqual([
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ]);
  });

  it('simplifies structured config entries back into a key-value map', () => {
    expect(
      t.simplifyAllowedValues([
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
      ]),
    ).toEqual({ '1': 'One', '2': 'Two' });
  });

  it('float simplify normalises .5 and 0.5 to the same key', () => {
    const tf = new ListFloatItem();
    expect(tf.simplifyAllowedValues([{ value: 0.5, label: 'Half' }])).toEqual({
      '0.5': 'Half',
    });
  });
});

describe('OptionsProviderInterface methods', () => {
  it('getSettableOptions returns the resolved allowed values', () => {
    const def = mockDefinition({ allowed_values: { '1': 'One', '2': 'Two' } });
    const t = new ListIntegerItem(def);
    expect(t.getSettableOptions()).toEqual({ '1': 'One', '2': 'Two' });
  });

  it('getPossibleOptions mirrors getSettableOptions', () => {
    const def = mockDefinition({ allowed_values: { a: 'A' } });
    const t = new ListStringItem(def);
    expect(t.getPossibleOptions()).toEqual(t.getSettableOptions());
  });

  it('getSettableValues returns the flattened keys', () => {
    const def = mockDefinition({ allowed_values: { '1': 'One', '2': 'Two' } });
    const t = new ListIntegerItem(def);
    expect(t.getSettableValues()).toEqual(['1', '2']);
  });

  it('getPossibleValues flattens opt-group keys', () => {
    const def = mockDefinition({
      allowed_values: { Group: { a: 'A', b: 'B' } } as never,
    });
    const t = new ListStringItem(def);
    expect(t.getPossibleValues()).toEqual(['a', 'b']);
  });

  it('throws when accessing options without a field definition', () => {
    const t = new ListIntegerItem();
    expect(() => t.getSettableOptions()).toThrow(/field definition/i);
  });
});
