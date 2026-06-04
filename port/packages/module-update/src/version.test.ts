import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  parseSupportBranchMajor,
  InvalidVersionError,
} from './version.js';

describe('parseVersion', () => {
  it('parses a legacy core-prefixed version', () => {
    const v = parseVersion('8.x-1.3');
    expect(v.major).toBe(1);
    expect(v.minor).toBe(3);
    expect(v.extra).toBeNull();
  });

  it('parses a semantic version', () => {
    const v = parseVersion('2.1.0');
    expect(v.major).toBe(2);
    expect(v.minor).toBe(1);
    expect(v.patch).toBe(0);
  });

  it('extracts the version extra', () => {
    expect(parseVersion('8.x-1.0-beta2').extra).toBe('beta2');
    expect(parseVersion('2.0.0-dev').extra).toBe('dev');
  });

  it('throws on a non-version string', () => {
    expect(() => parseVersion('not-a-version')).toThrow(InvalidVersionError);
    expect(() => parseVersion('')).toThrow(InvalidVersionError);
  });
});

describe('parseSupportBranchMajor', () => {
  it('reads the major from a legacy branch', () => {
    expect(parseSupportBranchMajor('8.x-2.')).toBe(2);
  });

  it('reads the major from a semantic branch', () => {
    expect(parseSupportBranchMajor('3.')).toBe(3);
  });
});
