import { describe, it, expect } from 'vitest';
import { Route } from './route.js';
import { RegexPathMatcher } from './path-matcher.js';

describe('RegexPathMatcher', () => {
  const matcher = new RegexPathMatcher();

  it('matches a static path with no parameters', () => {
    const result = matcher.match('/admin/config', new Route('/admin/config'));
    expect(result).toEqual({ parameters: {} });
  });

  it('returns null for a non-matching path', () => {
    expect(matcher.match('/admin/other', new Route('/admin/config'))).toBeNull();
  });

  it('extracts raw parameters from a dynamic path', () => {
    const result = matcher.match('/node/12', new Route('/node/{id}'));
    expect(result?.parameters).toEqual({ id: '12' });
  });

  it('honors requirements (digits only)', () => {
    const route = new Route('/node/{id}', {}, { id: '\\d+' });
    expect(matcher.match('/node/12', route)?.parameters).toEqual({ id: '12' });
    expect(matcher.match('/node/abc', route)).toBeNull();
  });

  it('normalizes a trailing slash before matching', () => {
    expect(matcher.match('/admin/config/', new Route('/admin/config'))).toEqual({
      parameters: {},
    });
  });

  it('adds a leading slash to a path lacking one', () => {
    expect(matcher.match('node/7', new Route('/node/{id}'))?.parameters).toEqual({
      id: '7',
    });
  });

  it('seeds defaults for variables not present (defensive)', () => {
    const route = new Route('/node/{id}', { id: '0' });
    expect(matcher.match('/node/9', route)?.parameters).toEqual({ id: '9' });
  });
});
