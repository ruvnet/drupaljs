/**
 * Resize effect — sets the image to an exact size.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\ResizeImageEffect`.
 */
import type { Dimensions, ImageInterface } from '../contracts.js';
import { ConfigurableImageEffectBase } from './image-effect-base.js';

export class ResizeImageEffect extends ConfigurableImageEffectBase {
  override defaultConfiguration(): Record<string, unknown> {
    return { width: null, height: null };
  }

  applyEffect(image: ImageInterface): boolean {
    const width = this.configuration['width'] as number;
    const height = this.configuration['height'] as number;
    if (!image.resize(width, height)) {
      this.logFailure('Image resize failed', image);
      return false;
    }
    return true;
  }

  override transformDimensions(dimensions: Dimensions, _uri: string): void {
    dimensions.width = this.configuration['width'] as number;
    dimensions.height = this.configuration['height'] as number;
  }

  /** Shared toolkit-failure logger used by the resize family of effects. */
  protected logFailure(message: string, image: ImageInterface): void {
    this.logger.error(message, {
      '%toolkit': image.getToolkitId(),
      '%path': image.getSource(),
      '%mimetype': image.getMimeType(),
      '%dimensions': `${image.getWidth()}x${image.getHeight()}`,
    });
  }
}
