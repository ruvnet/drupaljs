import { describe, it, expect } from 'vitest';
import { Rectangle } from './rectangle.js';

describe('Rectangle', () => {
  it('rejects non-positive dimensions', () => {
    expect(() => new Rectangle(0, 10)).toThrow(/Invalid dimensions/);
    expect(() => new Rectangle(10, -1)).toThrow(/Invalid dimensions/);
  });

  it('is unchanged at 0 degrees', () => {
    const r = new Rectangle(40, 20).rotate(0);
    expect(r.getBoundingWidth()).toBe(40);
    expect(r.getBoundingHeight()).toBe(20);
  });

  it('swaps dimensions at 90 degrees', () => {
    const r = new Rectangle(40, 20).rotate(90);
    expect(r.getBoundingWidth()).toBe(20);
    expect(r.getBoundingHeight()).toBe(40);
  });

  it('normalises negative angles (−90 behaves like 270)', () => {
    const r = new Rectangle(40, 20).rotate(-90);
    expect(r.getBoundingWidth()).toBe(20);
    expect(r.getBoundingHeight()).toBe(40);
  });

  it('grows the bounding box for a 45-degree rotation of a square', () => {
    const r = new Rectangle(100, 100).rotate(45);
    // Both dimensions grow to fit the diagonal; > original side.
    expect(r.getBoundingWidth()).toBeGreaterThan(100);
    expect(r.getBoundingHeight()).toBeGreaterThan(100);
    expect(r.getBoundingWidth()).toBe(r.getBoundingHeight());
  });
});
