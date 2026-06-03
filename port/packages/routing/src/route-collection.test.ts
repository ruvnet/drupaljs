import { describe, it, expect } from 'vitest';
import { Route } from './route.js';
import { RouteCollection } from './route-collection.js';

describe('RouteCollection', () => {
  it('adds and retrieves routes by name', () => {
    const c = new RouteCollection();
    const r = new Route('/a');
    c.add('a', r);
    expect(c.get('a')).toBe(r);
    expect(c.get('missing')).toBeNull();
    expect(c.count()).toBe(1);
  });

  it('preserves insertion order in keys()', () => {
    const c = new RouteCollection();
    c.add('first', new Route('/1'));
    c.add('second', new Route('/2'));
    c.add('third', new Route('/3'));
    expect(c.keys()).toEqual(['first', 'second', 'third']);
  });

  it('re-adding a name replaces the route', () => {
    const c = new RouteCollection();
    const original = new Route('/a');
    const replacement = new Route('/b');
    c.add('a', original);
    c.add('a', replacement);
    expect(c.get('a')).toBe(replacement);
    expect(c.count()).toBe(1);
  });

  it('removes routes by name and by list', () => {
    const c = new RouteCollection();
    c.add('a', new Route('/a'));
    c.add('b', new Route('/b'));
    c.add('c', new Route('/c'));
    c.remove('a');
    c.remove(['b', 'c']);
    expect(c.count()).toBe(0);
  });

  it('is iterable as [name, route] pairs', () => {
    const c = new RouteCollection();
    c.add('a', new Route('/a'));
    c.add('b', new Route('/b'));
    const seen = [...c].map(([name]) => name);
    expect(seen).toEqual(['a', 'b']);
  });

  it('addCollection merges another collection', () => {
    const a = new RouteCollection();
    a.add('a', new Route('/a'));
    const b = new RouteCollection();
    b.add('b', new Route('/b'));
    a.addCollection(b);
    expect(a.keys()).toEqual(['a', 'b']);
  });
});
