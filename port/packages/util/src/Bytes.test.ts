import { describe, it, expect } from 'vitest';
import { Bytes } from './Bytes.js';

describe('Bytes.toNumber', () => {
  it('parses a bare number', () => {
    expect(Bytes.toNumber('2')).toBe(2);
    expect(Bytes.toNumber(2.4)).toBe(2);
  });

  it('parses kilobytes', () => {
    expect(Bytes.toNumber('3K')).toBe(3 * 1024);
    expect(Bytes.toNumber('1kb')).toBe(1024);
  });

  it('parses megabytes and gigabytes', () => {
    expect(Bytes.toNumber('5MB')).toBe(5 * 1024 * 1024);
    expect(Bytes.toNumber('10G')).toBe(10 * 1024 * 1024 * 1024);
  });

  it('parses IEC-style and verbose units', () => {
    expect(Bytes.toNumber('6GiB')).toBe(6 * 1024 * 1024 * 1024);
    expect(Bytes.toNumber('9mbytes')).toBe(9 * 1024 * 1024);
    expect(Bytes.toNumber('8 bytes')).toBe(8);
  });

  it('rounds the result', () => {
    expect(Bytes.toNumber('1.5K')).toBe(1536);
  });
});

describe('Bytes.validate', () => {
  it('accepts numbers with valid suffixes', () => {
    expect(Bytes.validate('10MB')).toBe(true);
    expect(Bytes.validate('5 megabytes')).toBe(true);
    expect(Bytes.validate('42')).toBe(true);
  });

  it('rejects strings not starting with a digit', () => {
    expect(Bytes.validate('MB10')).toBe(false);
    expect(Bytes.validate('abc')).toBe(false);
  });

  it('rejects unknown suffixes', () => {
    expect(Bytes.validate('10furlongs')).toBe(false);
  });
});

describe('Bytes.format', () => {
  it('formats sub-kilobyte values as bytes', () => {
    expect(Bytes.format(512)).toBe('512 bytes');
  });

  it('formats kilobytes and megabytes', () => {
    expect(Bytes.format(1024)).toBe('1.00 KB');
    expect(Bytes.format(1024 * 1024)).toBe('1.00 MB');
  });

  it('respects the decimals argument', () => {
    expect(Bytes.format(1536, 1)).toBe('1.5 KB');
  });
});
