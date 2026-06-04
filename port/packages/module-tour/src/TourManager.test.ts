import { describe, it, expect } from 'vitest';
import { TourManager } from './TourManager.js';
import { Tour } from './Entity/Tour.js';
import type { AccountLike, TourStorageLike } from './contracts.js';

function account(perms: string[]): AccountLike {
  return { hasPermission: (p: string) => perms.includes(p) };
}

function storage(tours: Tour[]): TourStorageLike {
  const map: Record<string, Tour> = {};
  for (const t of tours) map[t.id()] = t;
  return { loadMultiple: () => map };
}

const tourA = new Tour({
  id: 'a',
  label: 'A',
  module: 'm',
  weight: 2,
  routes: [{ route_name: 'foo' }],
  tips: { t: { id: 't', plugin: 'text', label: 'T', body: 'x' } },
});
const tourB = new Tour({
  id: 'b',
  label: 'B',
  module: 'm',
  weight: 1,
  routes: [{ route_name: 'foo' }],
});
const tourC = new Tour({
  id: 'c',
  label: 'C',
  module: 'm',
  routes: [{ route_name: 'bar' }],
});

describe('TourManager', () => {
  it('returns tours bound to the given route, ordered by weight', () => {
    const mgr = new TourManager(storage([tourA, tourB, tourC]), account(['access tour']));
    const tours = mgr.getToursForRoute('foo');
    expect(tours.map((t) => t.id())).toEqual(['b', 'a']);
  });

  it('excludes tours bound to other routes', () => {
    const mgr = new TourManager(storage([tourA, tourC]), account(['access tour']));
    expect(mgr.getToursForRoute('bar').map((t) => t.id())).toEqual(['c']);
  });

  it('returns no tours when the account lacks the access tour permission', () => {
    const mgr = new TourManager(storage([tourA, tourB]), account([]));
    expect(mgr.getToursForRoute('foo')).toEqual([]);
  });

  it('hasTourForRoute reflects access and route binding', () => {
    const allowed = new TourManager(storage([tourA]), account(['access tour']));
    const denied = new TourManager(storage([tourA]), account([]));
    expect(allowed.hasTourForRoute('foo')).toBe(true);
    expect(allowed.hasTourForRoute('nope')).toBe(false);
    expect(denied.hasTourForRoute('foo')).toBe(false);
  });
});
