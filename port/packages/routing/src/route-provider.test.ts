import { describe, it, expect, vi } from 'vitest';
import { Route } from './route.js';
import { RouteCollection } from './route-collection.js';
import {
  InMemoryRouteProvider,
  RouteNotFoundException,
  type PathMatcher,
} from './index.js';
import type { PathMatchResult } from './path-matcher.js';

describe('InMemoryRouteProvider', () => {
  it('getRouteByName returns the registered route', () => {
    const route = new Route('/node/{id}');
    const provider = new InMemoryRouteProvider().addRoute('node.view', route);
    expect(provider.getRouteByName('node.view')).toBe(route);
  });

  it('getRouteByName throws RouteNotFoundException for an unknown name', () => {
    const provider = new InMemoryRouteProvider();
    expect(() => provider.getRouteByName('missing')).toThrow(RouteNotFoundException);
  });

  it('getRoutesByNames skips missing names and returns found ones', () => {
    const provider = new InMemoryRouteProvider()
      .addRoute('a', new Route('/a'))
      .addRoute('b', new Route('/b'));
    const found = provider.getRoutesByNames(['a', 'missing', 'b']);
    expect(Object.keys(found)).toEqual(['a', 'b']);
  });

  it('getRoutesByNames(null) returns all routes', () => {
    const provider = new InMemoryRouteProvider()
      .addRoute('a', new Route('/a'))
      .addRoute('b', new Route('/b'));
    expect(Object.keys(provider.getRoutesByNames(null))).toEqual(['a', 'b']);
  });

  it('getRoutesByPattern returns routes whose path contains the pattern', () => {
    const provider = new InMemoryRouteProvider()
      .addRoute('node', new Route('/node/{id}'))
      .addRoute('user', new Route('/user/{id}'));
    const result = provider.getRoutesByPattern('/node');
    expect(result.keys()).toEqual(['node']);
  });

  it('addCollection registers every route from a collection', () => {
    const collection = new RouteCollection();
    collection.add('a', new Route('/a'));
    collection.add('b', new Route('/b'));
    const provider = new InMemoryRouteProvider().addCollection(collection);
    expect(Object.keys(provider.getAllRoutes())).toEqual(['a', 'b']);
  });

  describe('getRouteCollectionForRequest (London-school: mock the matcher)', () => {
    it('delegates matching to the injected PathMatcher and returns matches', () => {
      const matched = new Route('/node/{id}');
      const unmatched = new Route('/user/{id}');
      const match = vi.fn<PathMatcher['match']>((_, route) =>
        route === matched ? ({ parameters: { id: '12' } } as PathMatchResult) : null,
      );
      const matcher: PathMatcher = { match };

      const provider = new InMemoryRouteProvider(matcher)
        .addRoute('node.view', matched)
        .addRoute('user.view', unmatched);

      const result = provider.getRouteCollectionForRequest({ pathInfo: '/node/12' });

      expect(result.keys()).toEqual(['node.view']);
      // Interaction assertions: every route was offered to the matcher.
      expect(match).toHaveBeenCalledTimes(2);
      expect(match).toHaveBeenCalledWith('/node/12', matched);
      expect(match).toHaveBeenCalledWith('/node/12', unmatched);
    });

    it('orders candidates by fit (most path parts) then by name', () => {
      const matcher: PathMatcher = { match: vi.fn(() => ({ parameters: {} })) };
      const provider = new InMemoryRouteProvider(matcher)
        .addRoute('zeta', new Route('/a/b/c'))
        .addRoute('alpha', new Route('/a/b/c'))
        .addRoute('short', new Route('/a'));
      const result = provider.getRouteCollectionForRequest({ pathInfo: '/a/b/c' });
      // Same fit ordered by name (alpha < zeta), then the shorter one last.
      expect(result.keys()).toEqual(['alpha', 'zeta', 'short']);
    });
  });
});
