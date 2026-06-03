import { describe, it, expect } from 'vitest';
import {
  DateTimePlainFormatter,
  DateTimeCustomFormatter,
  DateRangeDefaultFormatter,
} from './formatters.js';
import { DateTimeItem } from './DateTimeItem.js';
import { DateRangeItem } from './DateRangeItem.js';
import { DateTimeType, DateTimeRangeDisplayOptions } from './constants.js';

describe('DateTimePlainFormatter', () => {
  it('declares the datetime_plain plugin metadata', () => {
    expect(DateTimePlainFormatter.id).toBe('datetime_plain');
    expect(DateTimePlainFormatter.fieldTypes).toEqual(['datetime']);
  });

  it('renders a datetime value using the datetime storage format', () => {
    const f = new DateTimePlainFormatter(DateTimeType.DateTime);
    const item = new DateTimeItem({ value: '2001-01-15T05:28:07' });
    expect(f.viewElement(item)).toBe('2001-01-15T05:28:07');
  });

  it('renders a date-only value using the date storage format', () => {
    const f = new DateTimePlainFormatter(DateTimeType.Date);
    const item = new DateTimeItem({ value: '2001-01-15' });
    expect(f.viewElement(item)).toBe('2001-01-15');
  });

  it('returns null for an empty item', () => {
    const f = new DateTimePlainFormatter(DateTimeType.DateTime);
    expect(f.viewElement(new DateTimeItem({ value: null }))).toBeNull();
  });
});

describe('DateTimeCustomFormatter', () => {
  it('declares the datetime_custom plugin metadata', () => {
    expect(DateTimeCustomFormatter.id).toBe('datetime_custom');
    expect(DateTimeCustomFormatter.fieldTypes).toEqual(['datetime']);
  });

  it('defaults date_format to the datetime storage format', () => {
    expect(DateTimeCustomFormatter.defaultSettings()).toEqual({
      date_format: 'Y-m-d\\TH:i:s',
      timezone_override: '',
    });
  });

  it('renders with the configured date_format pattern', () => {
    const f = new DateTimeCustomFormatter(DateTimeType.DateTime, {
      date_format: 'l, F j, Y',
    });
    const item = new DateTimeItem({ value: '2001-01-05T04:08:09' });
    expect(f.viewElement(item)).toBe('Friday, January 5, 2001');
  });
});

describe('DateRangeDefaultFormatter', () => {
  const start = '2001-01-15T05:28:07';
  const end = '2001-03-15T11:24:15';

  it('declares the daterange_default plugin metadata', () => {
    expect(DateRangeDefaultFormatter.id).toBe('daterange_default');
    expect(DateRangeDefaultFormatter.fieldTypes).toEqual(['daterange']);
  });

  it('defaults from_to to both with a dash separator', () => {
    expect(DateRangeDefaultFormatter.defaultSettings()).toMatchObject({
      from_to: DateTimeRangeDisplayOptions.Both,
      separator: '-',
    });
  });

  it('renders both dates joined by the separator when from_to is both', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime);
    const item = new DateRangeItem({ value: start, end_value: end });
    expect(f.viewElement(item)).toBe(`${start} - ${end}`);
  });

  it('uses a custom separator', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime, {
      separator: 'to',
    });
    const item = new DateRangeItem({ value: start, end_value: end });
    expect(f.viewElement(item)).toBe(`${start} to ${end}`);
  });

  it('renders only the start date when from_to is start_date', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime, {
      from_to: DateTimeRangeDisplayOptions.StartDate,
    });
    const item = new DateRangeItem({ value: start, end_value: end });
    expect(f.viewElement(item)).toBe(start);
  });

  it('renders only the end date when from_to is end_date', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime, {
      from_to: DateTimeRangeDisplayOptions.EndDate,
    });
    const item = new DateRangeItem({ value: start, end_value: end });
    expect(f.viewElement(item)).toBe(end);
  });

  it('collapses to a single date when start equals end', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime);
    const item = new DateRangeItem({ value: start, end_value: start });
    expect(f.viewElement(item)).toBe(start);
  });

  it('returns null when either bound is missing', () => {
    const f = new DateRangeDefaultFormatter(DateTimeType.DateTime);
    expect(f.viewElement(new DateRangeItem({ value: start, end_value: null }))).toBeNull();
    expect(f.viewElement(new DateRangeItem({ value: null, end_value: end }))).toBeNull();
  });
});
