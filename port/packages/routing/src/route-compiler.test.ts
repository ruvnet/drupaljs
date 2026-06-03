import { describe, it, expect } from 'vitest';
import { Route } from './route.js';
import { compileRoute } from './route-compiler.js';

describe('compileRoute', () => {
  it('compiles a static path to a single text token', () => {
    const compiled = compileRoute(new Route('/admin/config'));
    expect(compiled.tokens).toEqual([['text', '/admin/config']]);
    expect(compiled.variables).toEqual([]);
    expect(compiled.staticPrefix).toBe('/admin/config');
  });

  it('compiles variables into a text token plus a separator-only variable token', () => {
    const compiled = compileRoute(new Route('/node/{id}'));
    expect(compiled.variables).toEqual(['id']);
    expect(compiled.tokens).toEqual([
      ['text', '/node'],
      ['variable', '/', '[^/]+', 'id'],
    ]);
  });

  it('uses explicit requirements when present', () => {
    const compiled = compileRoute(new Route('/node/{id}', {}, { id: '\\d+' }));
    expect(compiled.tokens).toEqual([
      ['text', '/node'],
      ['variable', '/', '\\d+', 'id'],
    ]);
  });

  it('handles multiple variables and a trailing static segment', () => {
    const compiled = compileRoute(new Route('/{a}/x/{b}/end'));
    expect(compiled.variables).toEqual(['a', 'b']);
    expect(compiled.tokens).toEqual([
      ['variable', '/', '[^/]+', 'a'],
      ['text', '/x'],
      ['variable', '/', '[^/]+', 'b'],
      ['text', '/end'],
    ]);
  });

  it('produces a regex that matches concrete paths', () => {
    const compiled = compileRoute(new Route('/node/{id}', {}, { id: '\\d+' }));
    expect(compiled.regex.test('/node/12')).toBe(true);
    expect(compiled.regex.test('/node/abc')).toBe(false);
    expect(compiled.regex.exec('/node/12')?.groups?.id).toBe('12');
  });

  it('memoizes per route and recompiles after a structural change', () => {
    const route = new Route('/node/{id}');
    const first = compileRoute(route);
    expect(compileRoute(route)).toBe(first);
    route.setRequirement('id', '\\d+');
    const second = compileRoute(route);
    expect(second).not.toBe(first);
    expect(second.tokens).toEqual([
      ['text', '/node'],
      ['variable', '/', '\\d+', 'id'],
    ]);
  });
});
