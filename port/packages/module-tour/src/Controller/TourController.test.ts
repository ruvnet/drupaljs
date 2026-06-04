import { describe, it, expect } from 'vitest';
import { TourController } from './TourController.js';
import { Tour } from '../Entity/Tour.js';

function makeTour() {
  return new Tour({
    id: 'demo',
    label: 'Demo',
    module: 'm',
    routes: [{ route_name: 'foo' }],
    tips: {
      's2': { id: 's2', plugin: 'text', label: 'Step 2', body: 'two', weight: 2 },
      's1': { id: 's1', plugin: 'text', label: 'Step 1', body: 'one', weight: 1 },
    },
  });
}

describe('TourController', () => {
  it('renders each tip in weight order into a tour render array', () => {
    const out = new TourController().renderTour(makeTour());
    expect(out['#theme']).toBe('tour');
    const tips = out['#tour'] as Record<string, unknown>;
    expect(Object.keys(tips)).toEqual(['s1', 's2']);
    const first = tips['s1'] as Record<string, unknown>;
    expect(first['#markup']).toContain('one');
  });

  it('attaches the tour library', () => {
    const out = new TourController().renderTour(makeTour());
    const attached = out['#attached'] as { library?: string[] };
    expect(attached.library).toContain('tour/tour');
  });

  it('renders an empty tour with no tips gracefully', () => {
    const empty = new Tour({ id: 'e', label: 'E', module: 'm', routes: [{ route_name: 'x' }] });
    const out = new TourController().renderTour(empty);
    expect(out['#tour']).toEqual({});
  });
});
