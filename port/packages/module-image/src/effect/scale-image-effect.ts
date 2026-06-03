/**
 * Scale effect — resizes preserving aspect ratio.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\ScaleImageEffect`.
 */
import type { Dimensions, ImageInterface } from '../contracts.js';
import { ResizeImageEffect } from './resize-image-effect.js';
import { scaleDimensions } from '../utility/image-math.js';

export class ScaleImageEffect extends ResizeImageEffect {
  override defaultConfiguration(): Record<string, unknown> {
    return { ...super.defaultConfiguration(), upscale: false };
  }

  override applyEffect(image: ImageInterface): boolean {
    const width = this.configuration['width'] as number | null;
    const height = this.configuration['height'] as number | null;
    const upscale = Boolean(this.configuration['upscale']);
    if (!image.scale(width, height, upscale)) {
      this.logFailure('Image scale failed', image);
      return false;
    }
    return true;
  }

  override transformDimensions(dimensions: Dimensions, _uri: string): void {
    if (dimensions.width && dimensions.height) {
      scaleDimensions(
        dimensions,
        this.configuration['width'] as number | null,
        this.configuration['height'] as number | null,
        Boolean(this.configuration['upscale']),
      );
    }
  }
}
