import { describe, it, expect } from 'vitest';
import { Markup, isMarkup, type MarkupInterface } from './markup.js';

describe('Markup', () => {
  it('wraps a known-safe string and returns it via toString()', () => {
    const m = Markup.create('<strong>safe</strong>');
    expect(isMarkup(m)).toBe(true);
    expect(String(m)).toBe('<strong>safe</strong>');
  });

  it('returns the empty string (not a Markup object) for a blank string', () => {
    const m = Markup.create('');
    expect(m).toBe('');
    expect(isMarkup(m)).toBe(false);
  });

  it('returns an existing MarkupInterface unchanged (idempotent)', () => {
    const original = Markup.create('<em>x</em>') as MarkupInterface;
    const again = Markup.create(original);
    expect(again).toBe(original);
  });

  it('casts non-string values to a string', () => {
    const m = Markup.create(42 as unknown as string);
    expect(String(m)).toBe('42');
  });

  it('reports its character length via count()', () => {
    const m = Markup.create('abcd') as MarkupInterface;
    expect(m.count()).toBe(4);
  });

  it('serializes to its raw string in JSON', () => {
    const m = Markup.create('<b>j</b>') as MarkupInterface;
    expect(JSON.stringify({ v: m })).toBe('{"v":"<b>j</b>"}');
  });

  it('isMarkup is false for plain strings and other values', () => {
    expect(isMarkup('plain')).toBe(false);
    expect(isMarkup(null)).toBe(false);
    expect(isMarkup(undefined)).toBe(false);
    expect(isMarkup(123)).toBe(false);
  });
});
