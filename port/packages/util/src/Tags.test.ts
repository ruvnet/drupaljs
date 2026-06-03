import { describe, it, expect } from 'vitest';
import { Tags } from './Tags.js';

describe('Tags.explode', () => {
  it('splits a simple comma-separated list', () => {
    expect(Tags.explode('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps quoted commas intact', () => {
    expect(Tags.explode('this, "company, llc", foo bar')).toEqual([
      'this',
      'company, llc',
      'foo bar',
    ]);
  });

  it('unescapes doubled quotes', () => {
    expect(Tags.explode('"and ""this"" w,o.rks"')).toEqual([
      'and "this" w,o.rks',
    ]);
  });

  it('deduplicates and drops empties', () => {
    expect(Tags.explode('a, a, , b')).toEqual(['a', 'b']);
  });
});

describe('Tags.encode', () => {
  it('leaves plain tags untouched', () => {
    expect(Tags.encode('plain')).toBe('plain');
  });

  it('quotes tags with commas', () => {
    expect(Tags.encode('company, llc')).toBe('"company, llc"');
  });

  it('quotes and doubles internal quotes', () => {
    expect(Tags.encode('say "hi"')).toBe('"say ""hi"""');
  });
});

describe('Tags.implode', () => {
  it('joins tags, quoting where needed', () => {
    expect(Tags.implode(['a', 'company, llc', 'b'])).toBe(
      'a, "company, llc", b',
    );
  });

  it('round-trips with explode', () => {
    const tags = ['this', 'company, llc', 'and "that"'];
    expect(Tags.explode(Tags.implode(tags))).toEqual(tags);
  });
});
