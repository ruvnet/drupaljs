/**
 * Image math helpers.
 *
 * Ports `Drupal\Component\Utility\Image` (scaleDimensions, getKeywordOffset)
 * from core/lib/Drupal/Component/Utility/Image.php. These are pure functions,
 * so they live in TS (per ADR-0015 only genuinely complex algorithms move to
 * Rust/WASM; this is straightforward arithmetic).
 */

import type { Dimensions } from '../contracts.js';

/**
 * Scales image dimensions while maintaining aspect ratio.
 *
 * Mutates `dimensions` in place. Returns true when the dimensions changed.
 *
 * @see Image::scaleDimensions()
 */
export function scaleDimensions(
  dimensions: Dimensions,
  width: number | null = null,
  height: number | null = null,
  upscale = false,
): boolean {
  const sourceWidth = dimensions.width;
  const sourceHeight = dimensions.height;
  if (sourceWidth === null || sourceHeight === null) {
    return false;
  }
  const aspect = sourceHeight / sourceWidth;

  // Calculate one of the dimensions from the other target dimension, preserving
  // the source aspect ratio. If a target dimension is missing it is the one
  // computed; if both are present, the dimension that would not exceed its
  // target is the one recalculated.
  let outWidth = width;
  let outHeight = height;
  if ((width && !height) || (width && height && aspect < height / width)) {
    outWidth = width;
    outHeight = Math.round(width * aspect);
  } else if (height) {
    outHeight = height;
    outWidth = Math.round(height / aspect);
  }

  if (outWidth === null || outHeight === null) {
    return false;
  }

  // Don't upscale unless asked to.
  if (!upscale && (outWidth >= sourceWidth || outHeight >= sourceHeight)) {
    return false;
  }

  dimensions.width = outWidth;
  dimensions.height = outHeight;
  return true;
}

/**
 * Returns the offset in pixels from the anchor.
 *
 * @see Image::getKeywordOffset()
 */
export function getKeywordOffset(anchor: string, currentSize: number, newSize: number): number {
  switch (anchor) {
    case 'bottom':
    case 'right':
      return currentSize - newSize;
    case 'center':
      return Math.round(currentSize / 2 - newSize / 2);
    case 'top':
    case 'left':
      return 0;
    default:
      throw new Error(`Invalid anchor '${anchor}' provided to getKeywordOffset()`);
  }
}
