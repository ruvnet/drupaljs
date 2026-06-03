import { describe, it, expect } from 'vitest';
import { LinkItem } from './link-item.js';
import { formatLinkItem, truncate } from './formatter.js';
import { defaultFormatterSettings, type LinkValueInput } from './types.js';

function item(value: LinkValueInput): LinkItem {
  const it = new LinkItem();
  it.setValue(value);
  return it;
}

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('hello', 80)).toBe('hello');
  });

  it('truncates and adds an ellipsis when over the limit', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('formatLinkItem', () => {
  it('uses the title as the link text when present', () => {
    const el = formatLinkItem(item({ uri: 'https://example.com', title: 'Example' }), {
      ...defaultFormatterSettings(),
    });
    expect(el).toEqual({
      type: 'link',
      title: 'Example',
      url: 'https://example.com',
    });
  });

  it('falls back to the URL string when there is no title', () => {
    const el = formatLinkItem(item('https://example.com/p'), {
      ...defaultFormatterSettings(),
    });
    expect(el.type).toBe('link');
    if (el.type === 'link') {
      expect(el.title).toBe('https://example.com/p');
    }
  });

  it('renders URL only as plain text when url_only + url_plain', () => {
    const el = formatLinkItem(item({ uri: 'https://example.com', title: 'X' }), {
      ...defaultFormatterSettings(),
      url_only: true,
      url_plain: true,
    });
    expect(el).toEqual({ type: 'plain_text', text: 'https://example.com' });
  });

  it('uses URL as text (ignoring title) when url_only but not url_plain', () => {
    const el = formatLinkItem(item({ uri: 'https://example.com', title: 'X' }), {
      ...defaultFormatterSettings(),
      url_only: true,
      url_plain: false,
    });
    expect(el.type).toBe('link');
    if (el.type === 'link') {
      expect(el.title).toBe('https://example.com');
    }
  });

  it('trims the link text to trim_length', () => {
    const el = formatLinkItem(
      item({ uri: 'https://example.com', title: 'abcdefghij' }),
      { ...defaultFormatterSettings(), trim_length: 5 },
    );
    if (el.type === 'link') {
      expect(el.title).toBe('abcd…');
    }
  });

  it('adds rel and target attributes when configured', () => {
    const el = formatLinkItem(item('https://example.com'), {
      ...defaultFormatterSettings(),
      rel: 'nofollow',
      target: '_blank',
    });
    if (el.type === 'link') {
      expect(el.attributes).toMatchObject({ rel: 'nofollow', target: '_blank' });
    }
  });

  it('sanitizes a javascript: attribute value injected via options', () => {
    const it = new LinkItem();
    it.setValue({
      uri: 'https://example.com',
      options: { attributes: { href: 'javascript:alert(1)' } },
    });
    const el = formatLinkItem(it, { ...defaultFormatterSettings() });
    if (el.type === 'link') {
      expect(el.attributes?.href).not.toContain('javascript:');
    }
  });

  it('falls back to <none> route when the uri is invalid', () => {
    const it = new LinkItem();
    // Empty uri -> getUrl throws -> formatter falls back.
    it.setValue({ uri: '' });
    const el = formatLinkItem(it, { ...defaultFormatterSettings() });
    expect(el.type).toBe('link');
  });
});
