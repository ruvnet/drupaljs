import { describe, it, expect } from 'vitest';
import { DateTimeItem } from './DateTimeItem.js';
import { DateTimeType } from './constants.js';

describe('DateTimeItem field type definition', () => {
  it('declares the datetime plugin metadata', () => {
    expect(DateTimeItem.id).toBe('datetime');
    expect(DateTimeItem.category).toBe('date_time');
    expect(DateTimeItem.defaultWidget).toBe('datetime_default');
    expect(DateTimeItem.defaultFormatter).toBe('datetime_default');
  });

  it('defaults the datetime_type storage setting to datetime', () => {
    expect(DateTimeItem.defaultStorageSettings()).toEqual({
      datetime_type: DateTimeType.DateTime,
    });
  });

  it('defines a single varchar(20) value column indexed on value', () => {
    const schema = DateTimeItem.schema();
    expect(schema.columns.value).toEqual({
      description: 'The date value.',
      type: 'varchar',
      length: 20,
    });
    expect(schema.indexes).toEqual({ value: ['value'] });
  });

  it('declares a required iso8601 value property plus a computed date', () => {
    const props = DateTimeItem.propertyDefinitions();
    expect(props.value).toMatchObject({ dataType: 'datetime_iso8601', required: true });
    expect(props.date).toMatchObject({ dataType: 'any', computed: true });
  });
});

describe('DateTimeItem instance behaviour', () => {
  it('is empty for null or empty-string value', () => {
    expect(new DateTimeItem({ value: null }).isEmpty()).toBe(true);
    expect(new DateTimeItem({ value: '' }).isEmpty()).toBe(true);
  });

  it('is not empty for a present value', () => {
    expect(new DateTimeItem({ value: '2001-01-15T05:28:07' }).isEmpty()).toBe(false);
  });

  it('computes a Date object from the stored value for the datetime type', () => {
    const item = new DateTimeItem({ value: '2001-01-15T05:28:07' });
    const date = item.getDate(DateTimeType.DateTime);
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(Date.UTC(2001, 0, 15, 5, 28, 7));
  });

  it('returns null computed date for an invalid stored value', () => {
    const item = new DateTimeItem({ value: 'garbage' });
    expect(item.getDate(DateTimeType.DateTime)).toBeNull();
  });
});

describe('DateTimeItem.generateSampleValue', () => {
  it('produces a datetime-format string for the datetime type', () => {
    const { value } = DateTimeItem.generateSampleValue(DateTimeType.DateTime);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  it('produces a date-only string for the date type', () => {
    const { value } = DateTimeItem.generateSampleValue(DateTimeType.Date);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
