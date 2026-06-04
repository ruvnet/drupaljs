import { describe, it, expect } from 'vitest';
import { LinkItem } from './link-item.js';

describe('LinkItem.setValue', () => {
  it('treats a bare string as the uri main property', () => {
    const item = new LinkItem();
    item.setValue('https://example.com');
    expect(item.uri).toBe('https://example.com');
    expect(item.title).toBeNull();
    expect(item.options).toEqual({});
  });

  it('accepts an object value with uri, title and options', () => {
    const item = new LinkItem();
    item.setValue({
      uri: 'internal:/node/1',
      title: 'Node one',
      options: { fragment: 'top' },
    });
    expect(item.uri).toBe('internal:/node/1');
    expect(item.title).toBe('Node one');
    expect(item.options).toEqual({ fragment: 'top' });
  });

  it('defaults options to an empty object when omitted', () => {
    const item = new LinkItem();
    item.setValue({ uri: 'internal:/foo' });
    expect(item.options).toEqual({});
  });

  it('clears values when set to null', () => {
    const item = new LinkItem();
    item.setValue('https://example.com');
    item.setValue(null);
    expect(item.uri).toBeNull();
    expect(item.isEmpty()).toBe(true);
  });
});

describe('LinkItem.isEmpty', () => {
  it('is empty when uri is null or empty string', () => {
    const item = new LinkItem();
    expect(item.isEmpty()).toBe(true);
    item.setValue({ uri: '' });
    expect(item.isEmpty()).toBe(true);
  });

  it('is not empty when uri is present', () => {
    const item = new LinkItem();
    item.setValue('internal:/node/1');
    expect(item.isEmpty()).toBe(false);
  });
});

describe('LinkItem.isExternal', () => {
  it('returns true for external uris', () => {
    const item = new LinkItem();
    item.setValue('https://example.com');
    expect(item.isExternal()).toBe(true);
  });

  it('returns false for internal uris', () => {
    const item = new LinkItem();
    item.setValue('internal:/node/1');
    expect(item.isExternal()).toBe(false);
  });
});

describe('LinkItem.getTitle', () => {
  it('returns the title when set', () => {
    const item = new LinkItem();
    item.setValue({ uri: 'internal:/a', title: 'Hi' });
    expect(item.getTitle()).toBe('Hi');
  });

  it('returns null when title is empty or unset', () => {
    const item = new LinkItem();
    item.setValue('internal:/a');
    expect(item.getTitle()).toBeNull();
    item.setValue({ uri: 'internal:/a', title: '' });
    expect(item.getTitle()).toBeNull();
  });
});

describe('LinkItem.getUrl', () => {
  it('returns a Url object exposing href, external flag and options', () => {
    const item = new LinkItem();
    item.setValue({
      uri: 'https://example.com/p',
      options: { query: { a: '1' }, fragment: 'f' },
    });
    const url = item.getUrl();
    expect(url.isExternal()).toBe(true);
    expect(url.toString()).toBe('https://example.com/p?a=1#f');
  });

  it('throws on an empty uri', () => {
    const item = new LinkItem();
    expect(() => item.getUrl()).toThrow();
  });
});

describe('LinkItem resolvable_uri onChange sync', () => {
  it('derives uri + options from a user-entered displayable string', () => {
    const item = new LinkItem();
    // A schemeless path should become an internal: uri.
    item.setValue({ resolvable_uri: '/node/5?foo=bar#sec' });
    expect(item.uri).toBe('internal:/node/5');
    expect(item.options).toEqual({
      query: { foo: 'bar' },
      fragment: 'sec',
    });
  });

  it('keeps an explicit scheme without prefixing internal:', () => {
    const item = new LinkItem();
    item.setValue({ resolvable_uri: 'https://example.com/x' });
    expect(item.uri).toBe('https://example.com/x');
  });
});
