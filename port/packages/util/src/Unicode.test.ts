import { describe, it, expect } from 'vitest';
import { Unicode } from './Unicode.js';

describe('Unicode.ucfirst / lcfirst', () => {
  it('capitalizes the first character', () => {
    expect(Unicode.ucfirst('hello world')).toBe('Hello world');
    expect(Unicode.ucfirst('über')).toBe('Über');
  });

  it('lowercases the first character', () => {
    expect(Unicode.lcfirst('Hello')).toBe('hello');
    expect(Unicode.lcfirst('ÜBER')).toBe('üBER');
  });

  it('handles the empty string', () => {
    expect(Unicode.ucfirst('')).toBe('');
    expect(Unicode.lcfirst('')).toBe('');
  });
});

describe('Unicode.ucwords', () => {
  it('capitalizes each word', () => {
    expect(Unicode.ucwords('hello brave new world')).toBe(
      'Hello Brave New World',
    );
  });

  it('capitalizes after punctuation boundaries', () => {
    expect(Unicode.ucwords('foo-bar baz')).toBe('Foo-Bar Baz');
  });
});

describe('Unicode.truncate', () => {
  it('returns the string unchanged when short enough', () => {
    expect(Unicode.truncate('short', 10)).toBe('short');
  });

  it('truncates to the exact character count', () => {
    expect(Unicode.truncate('abcdefgh', 5)).toBe('abcde');
  });

  it('adds an ellipsis within the limit', () => {
    const result = Unicode.truncate('abcdefgh', 5, false, true);
    expect(Array.from(result).length).toBeLessThanOrEqual(5);
    expect(result.endsWith('…')).toBe(true);
  });

  it('truncates on a word boundary when wordsafe', () => {
    const result = Unicode.truncate('Hello brave world', 12, true);
    expect(result).toBe('Hello brave');
  });

  it('handles multibyte characters by code point', () => {
    expect(Unicode.truncate('héllo wörld', 5)).toBe('héllo');
  });
});

describe('Unicode.truncateBytes', () => {
  it('returns the string unchanged when within the byte limit', () => {
    expect(Unicode.truncateBytes('abc', 5)).toBe('abc');
  });

  it('never splits a multibyte sequence', () => {
    // 'é' is two UTF-8 bytes; truncating to 3 bytes must not split it.
    const result = Unicode.truncateBytes('aéb', 2);
    expect(result).toBe('a');
  });
});

describe('Unicode.strcasecmp', () => {
  it('compares case-insensitively', () => {
    expect(Unicode.strcasecmp('abc', 'ABC')).toBe(0);
    expect(Unicode.strcasecmp('a', 'b')).toBeLessThan(0);
    expect(Unicode.strcasecmp('b', 'a')).toBeGreaterThan(0);
  });
});

describe('Unicode.validateUtf8', () => {
  it('accepts valid UTF-8 and the empty string', () => {
    expect(Unicode.validateUtf8('')).toBe(true);
    expect(Unicode.validateUtf8('héllo')).toBe(true);
  });

  it('rejects lone surrogates', () => {
    expect(Unicode.validateUtf8('\uD800')).toBe(false);
  });
});

describe('Unicode.encodingFromBOM', () => {
  it('detects a UTF-8 BOM', () => {
    expect(Unicode.encodingFromBOM('\xEF\xBB\xBF data')).toBe('UTF-8');
  });

  it('detects UTF-16 BOMs', () => {
    expect(Unicode.encodingFromBOM('\xFE\xFF')).toBe('UTF-16BE');
    expect(Unicode.encodingFromBOM('\xFF\xFE')).toBe('UTF-16LE');
  });

  it('returns false when no BOM is present', () => {
    expect(Unicode.encodingFromBOM('plain text')).toBe(false);
  });
});
