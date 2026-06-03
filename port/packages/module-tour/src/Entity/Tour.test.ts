import { describe, it, expect } from 'vitest';
import { Tour } from './Tour.js';

function tour() {
  return new Tour({
    id: 'tour-example',
    label: 'Example tour',
    module: 'example',
    routes: [{ route_name: 'example.page' }, { route_name: 'example.other' }],
    tips: {
      'tip-2': { id: 'tip-2', plugin: 'text', label: 'Second', body: 'b2', weight: 2 },
      'tip-1': { id: 'tip-1', plugin: 'text', label: 'First', body: 'b1', weight: 1 },
    },
  });
}

describe('Tour (config entity)', () => {
  it('exposes id, label and providing module', () => {
    const t = tour();
    expect(t.id()).toBe('tour-example');
    expect(t.label()).toBe('Example tour');
    expect(t.getModule()).toBe('example');
  });

  it('reports the route names it is bound to', () => {
    expect(tour().getRouteNames().sort()).toEqual(['example.other', 'example.page']);
  });

  it('hasMatchingRoute is true only for bound routes', () => {
    const t = tour();
    expect(t.hasMatchingRoute('example.page')).toBe(true);
    expect(t.hasMatchingRoute('unrelated.route')).toBe(false);
  });

  it('instantiates tip plugins sorted by ascending weight', () => {
    const tips = tour().getTips();
    expect(tips.map((tip) => tip.getId())).toEqual(['tip-1', 'tip-2']);
    expect(tips[0]!.getPluginId()).toBe('text');
  });

  it('getTip returns a single tip plugin by id, or undefined', () => {
    const t = tour();
    expect(t.getTip('tip-1')?.getLabel()).toBe('First');
    expect(t.getTip('missing')).toBeUndefined();
  });
});
