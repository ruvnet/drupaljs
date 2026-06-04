import { describe, it, expect, afterEach } from 'vitest';
import { UrlHelper } from './UrlHelper.js';

afterEach(() => {
  UrlHelper.setAllowedProtocols(['http', 'https']);
});

describe('UrlHelper.buildQuery', () => {
  it('encodes a flat query', () => {
    expect(UrlHelper.buildQuery({ a: '1', b: 'two words' })).toBe(
      'a=1&b=two%20words',
    );
  });

  it('keeps slashes readable', () => {
    expect(UrlHelper.buildQuery({ path: 'a/b/c' })).toBe('path=a/b/c');
  });

  it('emits a bare key for null values', () => {
    expect(UrlHelper.buildQuery({ flag: null })).toBe('flag');
  });

  it('recurses into nested objects', () => {
    expect(UrlHelper.buildQuery({ a: { b: '1', c: '2' } })).toBe(
      'a%5Bb%5D=1&a%5Bc%5D=2',
    );
  });
});

describe('UrlHelper.filterQueryParameters', () => {
  it('returns the query unchanged when nothing is excluded', () => {
    const q = { a: '1', b: '2' };
    expect(UrlHelper.filterQueryParameters(q)).toBe(q);
  });

  it('removes top-level and nested keys', () => {
    const q = { a: '1', b: { c: '2', d: '3' } };
    expect(UrlHelper.filterQueryParameters(q, ['a', 'b[c]'])).toEqual({
      b: { d: '3' },
    });
  });
});

describe('UrlHelper.parse', () => {
  it('parses an external URL grouping scheme/host/path', () => {
    const result = UrlHelper.parse('https://example.com/a?b=c#d');
    expect(result.path).toBe('https://example.com/a');
    expect(result.query).toEqual({ b: 'c' });
    expect(result.fragment).toBe('d');
  });

  it('parses an internal path', () => {
    const result = UrlHelper.parse('node/1?foo=bar#frag');
    expect(result.path).toBe('node/1');
    expect(result.query).toEqual({ foo: 'bar' });
    expect(result.fragment).toBe('frag');
  });
});

describe('UrlHelper.encodePath', () => {
  it('encodes but leaves slashes', () => {
    expect(UrlHelper.encodePath('foo bar/baz')).toBe('foo%20bar/baz');
  });
});

describe('UrlHelper.isExternal', () => {
  it('treats absolute http(s) URLs as external', () => {
    expect(UrlHelper.isExternal('https://example.com/foo')).toBe(true);
  });

  it('treats protocol-relative URLs as external', () => {
    expect(UrlHelper.isExternal('//example.com')).toBe(true);
  });

  it('treats internal paths as not external', () => {
    expect(UrlHelper.isExternal('node/1')).toBe(false);
    expect(UrlHelper.isExternal('/admin/content')).toBe(false);
  });

  it('treats javascript: as not external (dangerous protocol)', () => {
    expect(UrlHelper.isExternal('javascript:alert(1)')).toBe(false);
  });
});

describe('UrlHelper.stripDangerousProtocols', () => {
  it('strips javascript: protocols iteratively', () => {
    expect(UrlHelper.stripDangerousProtocols('javascript:alert(1)')).toBe(
      'alert(1)',
    );
    expect(
      UrlHelper.stripDangerousProtocols('java\0script:javascript:x'),
    ).not.toContain('javascript:');
  });

  it('leaves allowed protocols intact', () => {
    expect(UrlHelper.stripDangerousProtocols('https://example.com')).toBe(
      'https://example.com',
    );
  });

  it('respects setAllowedProtocols', () => {
    UrlHelper.setAllowedProtocols(['http', 'https', 'ftp']);
    expect(UrlHelper.stripDangerousProtocols('ftp://host/file')).toBe(
      'ftp://host/file',
    );
    expect(UrlHelper.getAllowedProtocols()).toContain('ftp');
  });
});

describe('UrlHelper.filterBadProtocol', () => {
  it('decodes entities, strips bad protocols, and escapes output', () => {
    expect(UrlHelper.filterBadProtocol('javascript:alert(1)')).toBe(
      'alert(1)',
    );
    // stripDangerousProtocols removes everything before the first colon (here
    // "<em>http"), then the remainder is HTML-escaped.
    expect(UrlHelper.filterBadProtocol('<em>http://safe</em>')).toBe(
      '//safe&lt;/em&gt;',
    );
  });
});

describe('UrlHelper.isValid', () => {
  it('validates absolute URLs', () => {
    expect(UrlHelper.isValid('https://example.com/foo?bar=1', true)).toBe(true);
    expect(UrlHelper.isValid('not a url', true)).toBe(false);
  });

  it('validates relative URLs', () => {
    expect(UrlHelper.isValid('foo/bar?baz=1')).toBe(true);
    expect(UrlHelper.isValid('has space')).toBe(false);
  });
});
