import { describe, it, expect } from 'vitest';
import { Random } from './Random.js';

describe('Random.string', () => {
  it('generates a string of the requested length', () => {
    const r = new Random();
    expect(r.string(16)).toHaveLength(16);
  });

  it('produces unique strings when requested', () => {
    const r = new Random();
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(r.string(8, true));
    }
    expect(seen.size).toBe(50);
  });

  it('honors a validator callback', () => {
    const r = new Random();
    const result = r.string(8, false, (s) => /^[A-Za-z]/.test(s));
    expect(/^[A-Za-z]/.test(result)).toBe(true);
  });
});

describe('Random.name', () => {
  it('always starts with a lowercase letter', () => {
    const r = new Random();
    for (let i = 0; i < 20; i++) {
      const name = r.name(10);
      expect(name).toHaveLength(10);
      expect(/^[a-z]/.test(name)).toBe(true);
      expect(/^[A-Za-z0-9]+$/.test(name)).toBe(true);
    }
  });
});

describe('Random.machineName', () => {
  it('produces lowercase letters/digits starting with a letter', () => {
    const r = new Random();
    const name = r.machineName(12);
    expect(name).toHaveLength(12);
    expect(/^[a-z][a-z0-9]*$/.test(name)).toBe(true);
  });

  it('produces unique machine names when requested', () => {
    const r = new Random();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      seen.add(r.machineName(8, true));
    }
    expect(seen.size).toBe(30);
  });
});

describe('Random.word', () => {
  it('returns a word of the exact length', () => {
    const r = new Random();
    expect(r.word(7)).toHaveLength(7);
    expect(/^[a-z]+$/.test(r.word(7))).toBe(true);
  });
});

describe('Random.object', () => {
  it('returns an object with the requested number of keys', () => {
    const r = new Random();
    const obj = r.object(5);
    expect(Object.keys(obj)).toHaveLength(5);
  });
});

describe('Random.sentences', () => {
  it('generates non-empty greeking with at least the requested words', () => {
    const r = new Random();
    const text = r.sentences(10);
    expect(text.length).toBeGreaterThan(0);
    expect(text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(10);
  });

  it('capitalizes words in title mode', () => {
    const r = new Random();
    const text = r.sentences(3, true);
    expect(text.split(' ').every((w) => /^[A-Z]/.test(w))).toBe(true);
  });
});

describe('Random.paragraphs', () => {
  it('separates paragraphs with blank lines', () => {
    const r = new Random();
    const text = r.paragraphs(3);
    expect(text.split('\n\n').filter((p) => p.trim() !== '')).toHaveLength(3);
  });
});
