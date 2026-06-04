import { describe, it, expect } from 'vitest';
import {
  formatStorage,
  parseStorage,
  isValidStorageValue,
} from './DateTimeStorageFormat.js';
import { DateTimeType } from './constants.js';

describe('formatStorage', () => {
  it('formats a date-and-time value as Y-m-d\\TH:i:s in UTC', () => {
    // 2001-01-15T05:28:07 UTC
    const date = new Date(Date.UTC(2001, 0, 15, 5, 28, 7));
    expect(formatStorage(date, DateTimeType.DateTime)).toBe('2001-01-15T05:28:07');
  });

  it('formats a date-only value as Y-m-d in UTC', () => {
    const date = new Date(Date.UTC(2001, 0, 15, 5, 28, 7));
    expect(formatStorage(date, DateTimeType.Date)).toBe('2001-01-15');
  });

  it('treats allday like date-only for storage', () => {
    const date = new Date(Date.UTC(2001, 0, 15, 5, 28, 7));
    expect(formatStorage(date, DateTimeType.AllDay)).toBe('2001-01-15');
  });

  it('zero-pads single-digit components', () => {
    const date = new Date(Date.UTC(2009, 8, 3, 2, 4, 6));
    expect(formatStorage(date, DateTimeType.DateTime)).toBe('2009-09-03T02:04:06');
  });
});

describe('parseStorage', () => {
  it('parses a date-and-time storage string into a UTC Date', () => {
    const d = parseStorage('2001-01-15T05:28:07', DateTimeType.DateTime);
    expect(d).not.toBeNull();
    expect(d!.getTime()).toBe(Date.UTC(2001, 0, 15, 5, 28, 7));
  });

  it('parses a date-only storage string at midnight UTC', () => {
    const d = parseStorage('2001-01-15', DateTimeType.Date);
    expect(d).not.toBeNull();
    expect(d!.getTime()).toBe(Date.UTC(2001, 0, 15, 0, 0, 0));
  });

  it('round-trips through formatStorage', () => {
    const value = '2020-02-29T23:59:59';
    const d = parseStorage(value, DateTimeType.DateTime);
    expect(formatStorage(d!, DateTimeType.DateTime)).toBe(value);
  });

  it('returns null on a malformed value', () => {
    expect(parseStorage('not-a-date', DateTimeType.DateTime)).toBeNull();
    expect(parseStorage('2001-13-99', DateTimeType.Date)).toBeNull();
  });

  it('rejects a datetime string when a date-only format is expected', () => {
    expect(parseStorage('2001-01-15T05:28:07', DateTimeType.Date)).toBeNull();
  });

  it('rejects a date-only string when a datetime format is expected', () => {
    expect(parseStorage('2001-01-15', DateTimeType.DateTime)).toBeNull();
  });
});

describe('isValidStorageValue', () => {
  it('accepts well-formed values for the matching type', () => {
    expect(isValidStorageValue('2001-01-15T05:28:07', DateTimeType.DateTime)).toBe(true);
    expect(isValidStorageValue('2001-01-15', DateTimeType.Date)).toBe(true);
  });

  it('rejects non-string and malformed values', () => {
    expect(isValidStorageValue('', DateTimeType.DateTime)).toBe(false);
    expect(isValidStorageValue('2001-01-15', DateTimeType.DateTime)).toBe(false);
    expect(isValidStorageValue('2001-02-30', DateTimeType.Date)).toBe(false);
  });
});
