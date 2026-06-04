/**
 * Crop effect — crops to an exact size from an anchor.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\CropImageEffect`.
 */
import type { ImageInterface } from '../contracts.js';
import { ResizeImageEffect } from './resize-image-effect.js';
import { getKeywordOffset } from '../utility/image-math.js';

export class CropImageEffect extends ResizeImageEffect {
  override defaultConfiguration(): Record<string, unknown> {
    return { ...super.defaultConfiguration(), anchor: 'center-center' };
  }

  override applyEffect(image: ImageInterface): boolean {
    const width = Number(this.configuration['width']);
    const height = Number(this.configuration['height']);
    const [anchorX, anchorY] = String(this.configuration['anchor']).split('-');
    const x = getKeywordOffset(anchorX ?? 'center', image.getWidth() ?? 0, width);
    const y = getKeywordOffset(anchorY ?? 'center', image.getHeight() ?? 0, height);
    if (!image.crop(x, y, width, height)) {
      this.logFailure('Image crop failed', image);
      return false;
    }
    return true;
  }
}
