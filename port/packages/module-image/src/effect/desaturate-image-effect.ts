/**
 * Desaturate effect — converts an image to grayscale.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\DesaturateImageEffect`.
 */
import type { ImageInterface } from '../contracts.js';
import { ImageEffectBase } from './image-effect-base.js';

export class DesaturateImageEffect extends ImageEffectBase {
  applyEffect(image: ImageInterface): boolean {
    if (!image.desaturate()) {
      this.logger.error('Image desaturate failed', {
        '%toolkit': image.getToolkitId(),
        '%path': image.getSource(),
        '%mimetype': image.getMimeType(),
        '%dimensions': `${image.getWidth()}x${image.getHeight()}`,
      });
      return false;
    }
    return true;
  }
}
