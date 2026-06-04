import { describe, it, expect } from 'vitest';
import { Route } from './route.js';

describe('Route', () => {
  it('normalizes the path to a single leading slash and no trailing slash', () => {
    expect(new Route('node/{id}').getPath()).toBe('/node/{id}');
    expect(new Route('//node//{id}/').getPath()).toBe('/node/{id}');
    expect(new Route('/').getPath()).toBe('/');
  });

  it('stores and returns defaults', () => {
    const route = new Route('/node/{id}', { id: '1', _controller: 'NodeController' });
    expect(route.getDefault('id')).toBe('1');
    expect(route.hasDefault('id')).toBe(true);
    expect(route.hasDefault('missing')).toBe(false);
    expect(route.getDefault('missing')).toBeNull();
    expect(route.getDefaults()).toEqual({ id: '1', _controller: 'NodeController' });
  });

  it('sanitizes requirements by stripping leading ^ and trailing $', () => {
    const route = new Route('/node/{id}', {}, { id: '^\\d+$' });
    expect(route.getRequirement('id')).toBe('\\d+');
    expect(route.hasRequirement('id')).toBe(true);
  });

  it('stores options and reads them back', () => {
    const route = new Route('/x', {}, {}, { _no_path: true });
    expect(route.getOption('_no_path')).toBe(true);
    expect(route.hasOption('_no_path')).toBe(true);
    expect(route.getOption('absent')).toBeNull();
  });

  it('uppercases methods and lowercases schemes', () => {
    const route = new Route('/x', {}, {}, {}, '', 'HTTPS', 'get');
    expect(route.getSchemes()).toEqual(['https']);
    expect(route.getMethods()).toEqual(['GET']);
  });

  it('getDefaults returns a copy that does not mutate internal state', () => {
    const route = new Route('/x', { a: 1 });
    const defaults = route.getDefaults();
    defaults.a = 999;
    expect(route.getDefault('a')).toBe(1);
  });

  it('clone produces an independent copy', () => {
    const route = new Route('/node/{id}', { id: '1' }, { id: '\\d+' });
    const copy = route.clone();
    copy.setDefault('id', '2');
    expect(route.getDefault('id')).toBe('1');
    expect(copy.getDefault('id')).toBe('2');
    expect(copy.getPath()).toBe('/node/{id}');
  });
});
