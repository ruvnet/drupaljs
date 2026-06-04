import { describe, it, expect } from 'vitest';
import { scaleDimensions, getKeywordOffset } from './image-math.js';
import type { Dimensions } from '../contracts.js';

describe('scaleDimensions', () => {
  it('calculates height from width preserving aspect ratio', () => {
    const dims: Dimensions = { width: 400, height: 200 };
    const changed = scaleDimensions(dims, 200, null, false);
    expect(changed).toBe(true);
    expect(dims).toEqual({ width: 200, height: 100 });
  });

  it('calculates width from height preserving aspect ratio', () => {
    const dims: Dimensions = { width: 400, height: 200 };
    scaleDimensions(dims, null, 100, false);
    expect(dims).toEqual({ width: 200, height: 100 });
  });

  it('constrains to the smaller scaled dimension when both are given', () => {
    const dims: Dimensions = { width: 400, height: 200 };
    // Target box 100x100: width-bound gives 100x50, height-bound 200x100.
    // The dimension that would not exceed its target wins => 100x50.
    scaleDimensions(dims, 100, 100, false);
    expect(dims).toEqual({ width: 100, height: 50 });
  });

  it('does not upscale when upscale is disabled', () => {
    const dims: Dimensions = { width: 100, height: 50 };
    const changed = scaleDimensions(dims, 200, null, false);
    expect(changed).toBe(false);
    expect(dims).toEqual({ width: 100, height: 50 });
  });

  it('upscales when upscale is enabled', () => {
    const dims: Dimensions = { width: 100, height: 50 };
    const changed = scaleDimensions(dims, 200, null, true);
    expect(changed).toBe(true);
    expect(dims).toEqual({ width: 200, height: 100 });
  });
});

describe('getKeywordOffset', () => {
  it('returns 0 for top/left anchors', () => {
    expect(getKeywordOffset('top', 100, 40)).toBe(0);
    expect(getKeywordOffset('left', 100, 40)).toBe(0);
  });

  it('returns current-new for bottom/right anchors', () => {
    expect(getKeywordOffset('bottom', 100, 40)).toBe(60);
    expect(getKeywordOffset('right', 100, 40)).toBe(60);
  });

  it('returns the centered, rounded offset for center', () => {
    expect(getKeywordOffset('center', 100, 40)).toBe(30);
    expect(getKeywordOffset('center', 101, 40)).toBe(31); // round(50.5-20)
  });

  it('throws on an invalid anchor', () => {
    expect(() => getKeywordOffset('middle', 100, 40)).toThrow(/Invalid anchor/);
  });
});
