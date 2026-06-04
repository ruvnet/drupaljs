import { describe, it, expect } from 'vitest';
import { DateRangeItem } from './DateRangeItem.js';
import { DateTimeType } from './constants.js';

describe('DateRangeItem field type definition', () => {
  it('declares the daterange plugin metadata', () => {
    expect(DateRangeItem.id).toBe('daterange');
    expect(DateRangeItem.category).toBe('date_time');
    expect(DateRangeItem.defaultWidget).toBe('daterange_default');
    expect(DateRangeItem.defaultFormatter).toBe('daterange_default');
  });

  it('adds an end_value column and index alongside the start value', () => {
    const schema = DateRangeItem.schema();
    expect(schema.columns.value).toMatchObject({
      description: 'The start date value.',
      type: 'varchar',
      length: 20,
    });
    expect(schema.columns.end_value).toMatchObject({
      description: 'The end date value.',
      type: 'varchar',
      length: 20,
    });
    expect(schema.indexes.value).toEqual(['value']);
    expect(schema.indexes.end_value).toEqual(['end_value']);
  });

  it('declares required start and end values plus computed start/end dates', () => {
    const props = DateRangeItem.propertyDefinitions();
    expect(props.value).toMatchObject({ dataType: 'datetime_iso8601', required: true });
    expect(props.end_value).toMatchObject({ dataType: 'datetime_iso8601', required: true });
    expect(props.start_date).toMatchObject({ computed: true, dateSource: 'value' });
    expect(props.end_date).toMatchObject({ computed: true, dateSource: 'end_value' });
  });
});

describe('DateRangeItem instance behaviour', () => {
  it('is empty only when both start and end are absent', () => {
    expect(new DateRangeItem({ value: null, end_value: null }).isEmpty()).toBe(true);
    expect(new DateRangeItem({ value: '', end_value: '' }).isEmpty()).toBe(true);
    expect(new DateRangeItem({ value: '2001-01-15', end_value: null }).isEmpty()).toBe(false);
    expect(new DateRangeItem({ value: null, end_value: '2001-01-16' }).isEmpty()).toBe(false);
  });

  it('computes start and end dates from stored values', () => {
    const item = new DateRangeItem({
      value: '2001-01-15T07:28:08',
      end_value: '2001-03-15T11:24:15',
    });
    expect(item.getStartDate(DateTimeType.DateTime)!.getTime()).toBe(
      Date.UTC(2001, 0, 15, 7, 28, 8),
    );
    expect(item.getEndDate(DateTimeType.DateTime)!.getTime()).toBe(
      Date.UTC(2001, 2, 15, 11, 24, 15),
    );
  });
});

describe('DateRangeItem.generateSampleValue', () => {
  it('produces an end one day after the start for date-only ranges', () => {
    const { value, end_value } = DateRangeItem.generateSampleValue(DateTimeType.Date);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end_value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const start = Date.parse(value + 'T00:00:00Z');
    const end = Date.parse(end_value + 'T00:00:00Z');
    expect(end - start).toBe(86400 * 1000);
  });
});
