import { describe, expect, it } from 'vitest';
import { textFieldType, textLongFieldType, textWithSummaryFieldType } from './field-types.js';
import type { TextItemValue } from './contracts.js';

const empty = (overrides: Partial<TextItemValue> = {}): TextItemValue => ({
  value: null,
  format: null,
  ...overrides,
});

describe('text field type', () => {
  it('has the core plugin metadata', () => {
    expect(textFieldType.id).toBe('text');
    expect(textFieldType.category).toBe('formatted_text');
    expect(textFieldType.defaultWidget).toBe('text_textfield');
    expect(textFieldType.defaultFormatter).toBe('text_default');
  });

  it('defaults max_length to 255', () => {
    expect(textFieldType.defaultStorageSettings()).toEqual({ max_length: 255 });
  });

  it('defaults allowed_formats to empty', () => {
    expect(textFieldType.defaultFieldSettings()).toEqual({ allowed_formats: [] });
  });

  it('uses a varchar value column sized to max_length plus a format column and index', () => {
    const schema = textFieldType.schema({ max_length: 100 });
    expect(schema.columns.value).toEqual({ type: 'varchar', length: 100 });
    expect(schema.columns.format).toEqual({ type: 'varchar', length: 255 });
    expect(schema.indexes.format).toEqual(['format']);
  });

  it('exposes value, format and processed properties', () => {
    expect(textFieldType.propertyNames()).toEqual(['value', 'format', 'processed']);
  });

  it('is empty when value is null or empty string', () => {
    expect(textFieldType.isEmpty(empty())).toBe(true);
    expect(textFieldType.isEmpty(empty({ value: '' }))).toBe(true);
    expect(textFieldType.isEmpty(empty({ value: 'hi' }))).toBe(false);
  });

  it('adds a Length constraint when max_length is set', () => {
    const constraints = textFieldType.getConstraints({ max_length: 50 });
    const length = constraints.find((c) => c.name === 'Length');
    expect(length).toBeDefined();
    expect(length?.options).toMatchObject({ max: 50 });
  });

  it('adds no Length constraint when max_length is absent', () => {
    expect(textFieldType.getConstraints({})).toEqual([]);
  });
});

describe('text_long field type', () => {
  it('has the core plugin metadata', () => {
    expect(textLongFieldType.id).toBe('text_long');
    expect(textLongFieldType.defaultWidget).toBe('text_textarea');
  });

  it('uses a big text value column (no fixed length)', () => {
    const schema = textLongFieldType.schema({});
    expect(schema.columns.value).toEqual({ type: 'text', size: 'big' });
    expect(schema.columns.format).toEqual({ type: 'varchar_ascii', length: 255 });
    expect(schema.indexes.format).toEqual(['format']);
  });

  it('has no Length constraint regardless of settings', () => {
    expect(textLongFieldType.getConstraints({ max_length: 9 })).toEqual([]);
  });
});

describe('text_with_summary field type', () => {
  it('has the core plugin metadata', () => {
    expect(textWithSummaryFieldType.id).toBe('text_with_summary');
    expect(textWithSummaryFieldType.defaultWidget).toBe('text_textarea_with_summary');
  });

  it('defaults display_summary off and required_summary false', () => {
    expect(textWithSummaryFieldType.defaultFieldSettings()).toEqual({
      allowed_formats: [],
      display_summary: false,
      required_summary: false,
    });
  });

  it('adds a summary column to the schema', () => {
    const schema = textWithSummaryFieldType.schema({});
    expect(schema.columns.summary).toEqual({ type: 'text', size: 'big' });
  });

  it('exposes summary and summary_processed in addition to base properties', () => {
    expect(textWithSummaryFieldType.propertyNames()).toEqual([
      'value',
      'format',
      'processed',
      'summary',
      'summary_processed',
    ]);
  });

  it('is empty only when both value and summary are empty', () => {
    expect(textWithSummaryFieldType.isEmpty(empty())).toBe(true);
    expect(textWithSummaryFieldType.isEmpty(empty({ summary: 'note' }))).toBe(false);
    expect(textWithSummaryFieldType.isEmpty(empty({ value: 'body' }))).toBe(false);
  });

  it('requires the summary when required_summary is set', () => {
    const constraints = textWithSummaryFieldType.getConstraints({ required_summary: true });
    expect(constraints.some((c) => c.name === 'NotNull')).toBe(true);
    expect(textWithSummaryFieldType.getConstraints({ required_summary: false })).toEqual([]);
  });
});
