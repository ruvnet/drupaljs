import { describe, it, expect, beforeEach } from 'vitest';
import { Html, FallbackHtmlFilter, type HtmlFilter } from './Html.js';

beforeEach(() => {
  Html.resetSeenIds();
  Html.setIsAjax(false);
  Html.setFilter(new FallbackHtmlFilter());
});

describe('Html.escape', () => {
  it('converts the five special characters', () => {
    expect(Html.escape(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#039;&amp;&#039;&lt;/a&gt;',
    );
  });

  it('double-escapes already-escaped entities', () => {
    expect(Html.escape('&lt;')).toBe('&amp;lt;');
  });
});

describe('Html.decodeEntities', () => {
  it('decodes named and numeric entities once', () => {
    expect(Html.decodeEntities('&lt;script&gt;')).toBe('<script>');
    expect(Html.decodeEntities('&#39;')).toBe("'");
    expect(Html.decodeEntities('&#x27;')).toBe("'");
    expect(Html.decodeEntities('&eacute;')).toBe('é');
  });

  it('only decodes a single level', () => {
    expect(Html.decodeEntities('&amp;lt;')).toBe('&lt;');
  });
});

describe('Html.cleanCssIdentifier', () => {
  it('replaces spaces, underscores, slashes and brackets', () => {
    expect(Html.cleanCssIdentifier('one two')).toBe('one-two');
    expect(Html.cleanCssIdentifier('a/b[c]')).toBe('a-b-c');
  });

  it('preserves double underscores', () => {
    expect(Html.cleanCssIdentifier('a__b')).toBe('a__b');
  });

  it('prefixes leading digits and double hyphens', () => {
    expect(Html.cleanCssIdentifier('1abc')).toBe('_abc');
    expect(Html.cleanCssIdentifier('--abc')).toBe('__abc');
  });
});

describe('Html.getId', () => {
  it('lowercases and sanitizes', () => {
    expect(Html.getId('Edit Comment')).toBe('edit-comment');
    expect(Html.getId('a[b]')).toBe('a-b');
  });

  it('collapses consecutive hyphens', () => {
    expect(Html.getId('a---b')).toBe('a-b');
  });
});

describe('Html.getUniqueId', () => {
  it('appends a counter for duplicate IDs', () => {
    expect(Html.getUniqueId('edit')).toBe('edit');
    expect(Html.getUniqueId('edit')).toBe('edit--2');
    expect(Html.getUniqueId('edit')).toBe('edit--3');
  });

  it('resets state via resetSeenIds', () => {
    Html.getUniqueId('foo');
    Html.resetSeenIds();
    expect(Html.getUniqueId('foo')).toBe('foo');
  });
});

describe('Html.getClass', () => {
  it('lowercases and cleans, caching the result', () => {
    expect(Html.getClass('My Class')).toBe('my-class');
    expect(Html.getClass('My Class')).toBe('my-class');
  });
});

describe('Html.filter (pluggable)', () => {
  it('uses the fallback filter to strip scripts and event handlers', () => {
    const dirty = '<p onclick="x()">hi</p><script>evil()</script>';
    const clean = Html.filter(dirty);
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('<p>hi</p>');
  });

  it('drops tags outside the allow-list', () => {
    expect(Html.filter('<b>x</b><iframe></iframe>', ['b'])).toBe('<b>x</b>');
  });

  it('delegates to an injected HtmlFilter implementation', () => {
    const stub: HtmlFilter = {
      filter: (html) => `FILTERED:${html}`,
    };
    Html.setFilter(stub);
    expect(Html.filter('<x>')).toBe('FILTERED:<x>');
    expect(Html.getFilter()).toBe(stub);
  });
});
