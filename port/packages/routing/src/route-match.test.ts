import { describe, it, expect } from 'vitest';
import { Route } from './route.js';
import { RouteMatch, NullRouteMatch } from './route-match.js';

describe('RouteMatch', () => {
  it('exposes the route name and object', () => {
    const route = new Route('/node/{id}');
    const match = new RouteMatch('node.view', route, { id: 12 }, { id: '12' });
    expect(match.getRouteName()).toBe('node.view');
    expect(match.getRouteObject()).toBe(route);
  });

  it('returns processed and raw parameters', () => {
    const route = new Route('/node/{id}');
    const match = new RouteMatch('node.view', route, { id: 12 }, { id: '12' });
    expect(match.getParameter('id')).toBe(12);
    expect(match.getRawParameter('id')).toBe('12');
    expect(match.getParameters()).toEqual({ id: 12 });
    expect(match.getRawParameters()).toEqual({ id: '12' });
  });

  it('returns null for parameters the route does not define', () => {
    const route = new Route('/node/{id}');
    const match = new RouteMatch('node.view', route, { id: 12 }, { id: '12' });
    expect(match.getParameter('nope')).toBeNull();
    expect(match.getRawParameter('nope')).toBeNull();
  });

  it('pre-filters parameters to route variables only', () => {
    const route = new Route('/node/{id}');
    const match = new RouteMatch(
      'node.view',
      route,
      { id: 12, extra: 'x' },
      { id: '12', extra: 'x' },
    );
    expect(match.getParameters()).toEqual({ id: 12 });
    expect(match.getParameter('extra')).toBeNull();
  });

  it('includes non-underscore defaults as parameters but excludes _-prefixed ones', () => {
    const route = new Route('/page', { view_mode: 'full', _controller: 'C' });
    const match = new RouteMatch('page', route, { view_mode: 'teaser', _controller: 'C' });
    expect(match.getParameter('view_mode')).toBe('teaser');
    expect(match.getParameter('_controller')).toBeNull();
  });
});

describe('NullRouteMatch', () => {
  it('returns nulls and empty bags', () => {
    const match = new NullRouteMatch();
    expect(match.getRouteName()).toBeNull();
    expect(match.getRouteObject()).toBeNull();
    expect(match.getParameter('id')).toBeNull();
    expect(match.getRawParameter('id')).toBeNull();
    expect(match.getParameters()).toEqual({});
    expect(match.getRawParameters()).toEqual({});
  });
});
