/**
 * Rotate effect — rotates by a fixed (or randomised) angle.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\RotateImageEffect`.
 */
import type { Dimensions, ImageInterface } from '../contracts.js';
import { ConfigurableImageEffectBase } from './image-effect-base.js';
import { Rectangle } from '../utility/rectangle.js';

export class RotateImageEffect extends ConfigurableImageEffectBase {
  override defaultConfiguration(): Record<string, unknown> {
    return { degrees: 0, bgcolor: null, random: false };
  }

  applyEffect(image: ImageInterface): boolean {
    if (this.configuration['random']) {
      const degrees = Math.abs(Number(this.configuration['degrees']));
      // Random integer in [-degrees, degrees], matching PHP rand().
      this.configuration['degrees'] = Math.floor(Math.random() * (2 * degrees + 1)) - degrees;
    }

    const degrees = Number(this.configuration['degrees']);
    const bgcolor = (this.configuration['bgcolor'] as string | null) ?? null;
    if (!image.rotate(degrees, bgcolor)) {
      this.logger.error('Image rotate failed', {
        '%toolkit': image.getToolkitId(),
        '%path': image.getSource(),
        '%mimetype': image.getMimeType(),
        '%dimensions': `${image.getWidth()}x${image.getHeight()}`,
      });
      return false;
    }
    return true;
  }

  override transformDimensions(dimensions: Dimensions, _uri: string): void {
    // Only deterministic when the rotation is fixed and dimensions are known.
    if (!this.configuration['random'] && dimensions.width && dimensions.height) {
      const rect = new Rectangle(dimensions.width, dimensions.height).rotate(
        Number(this.configuration['degrees']),
      );
      dimensions.width = rect.getBoundingWidth();
      dimensions.height = rect.getBoundingHeight();
    } else {
      dimensions.width = null;
      dimensions.height = null;
    }
  }
}
