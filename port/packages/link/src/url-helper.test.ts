import { describe, it, expect } from 'vitest';
import {
  parseUri,
  isExternalUri,
  getUriScheme,
  filterBadProtocol,
  getAllowedProtocols,
  parse,
} from './url-helper.js';

describe('getUriScheme', () => {
  it('extracts scheme from a fully qualified URI', () => {
    expect(getUriScheme('https://example.com/foo')).toBe('https');
    expect(getUriScheme('mailto:a@b.com')).toBe('mailto');
    expect(getUriScheme('internal:/node/1')).toBe('internal');
  });

  it('returns null when there is no scheme', () => {
    expect(getUriScheme('/node/1')).toBeNull();
    expect(getUriScheme('node/1')).toBeNull();
  });
});

describe('isExternalUri', () => {
  it('treats http(s) URIs as external', () => {
    expect(isExternalUri('https://example.com')).toBe(true);
    expect(isExternalUri('http://example.com/path?q=1')).toBe(true);
    expect(isExternalUri('mailto:user@example.com')).toBe(true);
  });

  it('treats internal/entity/route schemes as internal', () => {
    expect(isExternalUri('internal:/node/1')).toBe(false);
    expect(isExternalUri('entity:node/1')).toBe(false);
    expect(isExternalUri('route:<front>')).toBe(false);
    expect(isExternalUri('base:robots.txt')).toBe(false);
  });

  it('treats relative/schemeless paths as internal', () => {
    expect(isExternalUri('/node/1')).toBe(false);
    expect(isExternalUri('node/1')).toBe(false);
  });

  it('rejects protocol-relative URLs as not external (security)', () => {
    // Drupal's UrlHelper::isExternal returns FALSE for //evil.com to avoid
    // open-redirect style issues; such input is not a valid absolute URL.
    expect(isExternalUri('//evil.com')).toBe(false);
  });
});

describe('filterBadProtocol', () => {
  it('strips disallowed protocols', () => {
    expect(filterBadProtocol('javascript:alert(1)')).toBe('alert(1)');
    expect(filterBadProtocol('vbscript:foo')).toBe('foo');
  });

  it('keeps allowed protocols intact', () => {
    expect(filterBadProtocol('https://example.com')).toBe('https://example.com');
    expect(filterBadProtocol('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(filterBadProtocol('/relative/path')).toBe('/relative/path');
  });

  it('decodes and re-strips obfuscated protocols', () => {
    expect(filterBadProtocol('java\nscript:alert(1)')).toBe('alert(1)');
    expect(filterBadProtocol('java&#x09;script:alert(1)')).toBe('alert(1)');
  });

  it('escapes html special chars in the output', () => {
    expect(filterBadProtocol('https://example.com?a=1&b=2')).toBe(
      'https://example.com?a=1&amp;b=2',
    );
  });
});

describe('getAllowedProtocols', () => {
  it('includes the standard safe protocols', () => {
    const protocols = getAllowedProtocols();
    expect(protocols).toContain('http');
    expect(protocols).toContain('https');
    expect(protocols).toContain('mailto');
    expect(protocols).not.toContain('javascript');
  });
});

describe('parse', () => {
  it('splits path, query and fragment of an internal path', () => {
    expect(parse('/node/1?foo=bar&baz=qux#frag')).toEqual({
      path: '/node/1',
      query: { foo: 'bar', baz: 'qux' },
      fragment: 'frag',
    });
  });

  it('splits an external URL', () => {
    expect(parse('https://example.com/path?x=1#y')).toEqual({
      path: 'https://example.com/path',
      query: { x: '1' },
      fragment: 'y',
    });
  });

  it('handles a bare path', () => {
    expect(parse('/about')).toEqual({ path: '/about', query: {}, fragment: '' });
  });
});

describe('parseUri', () => {
  it('parses an external uri to options + external flag', () => {
    const parsed = parseUri('https://example.com/p?a=1#f');
    expect(parsed.external).toBe(true);
    expect(parsed.path).toBe('https://example.com/p');
    expect(parsed.query).toEqual({ a: '1' });
    expect(parsed.fragment).toBe('f');
  });

  it('parses an internal: uri preserving the path after the scheme', () => {
    const parsed = parseUri('internal:/node/1?a=1');
    expect(parsed.external).toBe(false);
    expect(parsed.path).toBe('/node/1');
    expect(parsed.query).toEqual({ a: '1' });
  });
});
