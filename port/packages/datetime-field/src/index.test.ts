import { describe, it, expect } from 'vitest';
import * as api from './index.js';

describe('@drupaljs/datetime-field public API', () => {
  it('exports the field types', () => {
    expect(typeof api.DateTimeItem).toBe('function');
    expect(typeof api.DateRangeItem).toBe('function');
  });

  it('exports the storage codec', () => {
    expect(typeof api.formatStorage).toBe('function');
    expect(typeof api.parseStorage).toBe('function');
    expect(typeof api.isValidStorageValue).toBe('function');
    expect(typeof api.isTimeBearing).toBe('function');
  });

  it('exports the formatters', () => {
    expect(api.DateTimePlainFormatter.id).toBe('datetime_plain');
    expect(api.DateTimeCustomFormatter.id).toBe('datetime_custom');
    expect(api.DateRangeDefaultFormatter.id).toBe('daterange_default');
  });

  it('exports constants and enums', () => {
    expect(api.STORAGE_TIMEZONE).toBe('UTC');
    expect(api.DATETIME_STORAGE_FORMAT).toBe('Y-m-d\\TH:i:s');
    expect(api.DateTimeType.DateTime).toBe('datetime');
    expect(api.DateTimeRangeDisplayOptions.Both).toBe('both');
  });
});
