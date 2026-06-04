/**
 * Scale-and-crop effect — scales to cover the box, then crops the overflow.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\ScaleAndCropImageEffect`.
 */
import type { ImageInterface } from '../contracts.js';
import { CropImageEffect } from './crop-image-effect.js';
import { getKeywordOffset } from '../utility/image-math.js';

export class ScaleAndCropImageEffect extends CropImageEffect {
  override applyEffect(image: ImageInterface): boolean {
    const width = Number(this.configuration['width']);
    const height = Number(this.configuration['height']);
    const imageWidth = image.getWidth() ?? 0;
    const imageHeight = image.getHeight() ?? 0;
    const scale = Math.max(width / imageWidth, height / imageHeight);

    const [anchorX, anchorY] = String(this.configuration['anchor']).split('-');
    const x = getKeywordOffset(anchorX ?? 'center', Math.round(imageWidth * scale), width);
    const y = getKeywordOffset(anchorY ?? 'center', Math.round(imageHeight * scale), height);

    if (!image.apply('scale_and_crop', { x, y, width, height })) {
      this.logFailure('Image scale and crop failed', image);
      return false;
    }
    return true;
  }
}
