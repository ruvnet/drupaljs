import { describe, it, expect } from 'vitest';
import { TourHooks } from './TourHooks.js';
import { TourManager } from '../TourManager.js';
import { Tour } from '../Entity/Tour.js';
import type { AccountLike, RenderArray, RouteMatchLike, TourStorageLike } from '../contracts.js';

function account(perms: string[]): AccountLike {
  return { hasPermission: (p: string) => perms.includes(p) };
}
function storage(tours: Tour[]): TourStorageLike {
  const map: Record<string, Tour> = {};
  for (const t of tours) map[t.id()] = t;
  return { loadMultiple: () => map };
}
function routeMatch(name: string | null): RouteMatchLike {
  return { getRouteName: () => name };
}

const tour = new Tour({
  id: 't',
  label: 'T',
  module: 'm',
  routes: [{ route_name: 'foo' }],
  tips: { x: { id: 'x', plugin: 'text', label: 'X', body: 'b' } },
});

function hooks(perms: string[], route: string | null) {
  const mgr = new TourManager(storage([tour]), account(perms));
  return new TourHooks(mgr, routeMatch(route));
}

describe('TourHooks', () => {
  it('help() returns text for the tour help route', () => {
    expect(hooks(['access tour'], 'foo').help('help.page.tour')).toContain('Tour');
  });

  it('help() returns empty for unrelated routes', () => {
    expect(hooks([], 'foo').help('help.page.node')).toBe('');
  });

  it('pageAttachments() attaches the tour library on a matching route with access', () => {
    const page: RenderArray = {};
    hooks(['access tour'], 'foo').pageAttachments(page);
    const attached = page['#attached'] as { library?: string[] };
    expect(attached.library).toContain('tour/tour');
  });

  it('pageAttachments() does nothing without access', () => {
    const page: RenderArray = {};
    hooks([], 'foo').pageAttachments(page);
    expect(page['#attached']).toBeUndefined();
  });

  it('pageAttachments() does nothing on a route with no tours', () => {
    const page: RenderArray = {};
    hooks(['access tour'], 'unbound').pageAttachments(page);
    expect(page['#attached']).toBeUndefined();
  });

  it('pageAttachments() is a no-op when there is no current route', () => {
    const page: RenderArray = {};
    hooks(['access tour'], null).pageAttachments(page);
    expect(page['#attached']).toBeUndefined();
  });
});
