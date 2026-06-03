import { describe, it, expect } from 'vitest';
import { intToAlphadecimal, alphadecimalToInt } from './index.js';

describe('thread — intToAlphadecimal (ports Number::intToAlphadecimal)', () => {
  it('encodes small integers with a length-prefix character', () => {
    // base_convert(0,10,36)='0' (len 1) -> chr(1+48-1)='0' + '0' => '00'.
    expect(intToAlphadecimal(0)).toBe('00');
    expect(intToAlphadecimal(1)).toBe('01');
    expect(intToAlphadecimal(35)).toBe('0z');
  });

  it('rolls the length prefix when the base-36 width grows', () => {
    // 36 -> base36 '10' (len 2) -> prefix chr(2+48-1)='1' => '110'.
    expect(intToAlphadecimal(36)).toBe('110');
  });

  it('codes sort as strings in numeric order', () => {
    const codes = [0, 1, 2, 35, 36, 37, 1295, 1296].map(intToAlphadecimal);
    const sorted = [...codes].sort();
    expect(sorted).toEqual(codes);
  });
});

describe('thread — alphadecimalToInt (ports Number::alphadecimalToInt)', () => {
  it('decodes back to the original integer (round-trip)', () => {
    for (const i of [0, 1, 35, 36, 100, 1295, 1296, 9999]) {
      expect(alphadecimalToInt(intToAlphadecimal(i))).toBe(i);
    }
  });

  it('treats the empty string as 0 (back-compat behaviour)', () => {
    expect(alphadecimalToInt('')).toBe(0);
  });

  it('throws on invalid (non-alphanumeric) characters', () => {
    expect(() => alphadecimalToInt('0$%')).toThrow(/Invalid characters/);
  });
});
