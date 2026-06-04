import { describe, it, expect } from 'vitest';
import { flattenOptions } from './opt-group.js';

// Port of Drupal\Core\Form\OptGroup behaviour.
describe('flattenOptions', () => {
  it('returns a flat map unchanged', () => {
    expect(flattenOptions({ a: 'Apple', b: 'Banana' })).toEqual({
      a: 'Apple',
      b: 'Banana',
    });
  });

  it('flattens nested opt-group arrays into a single level', () => {
    const grouped = {
      Fruit: { a: 'Apple', b: 'Banana' },
      Veg: { c: 'Carrot' },
    };
    expect(flattenOptions(grouped)).toEqual({
      a: 'Apple',
      b: 'Banana',
      c: 'Carrot',
    });
  });

  it('keeps the last value when nested keys collide', () => {
    const grouped = {
      One: { x: 'first' },
      Two: { x: 'second' },
    };
    expect(flattenOptions(grouped)).toEqual({ x: 'second' });
  });
});
