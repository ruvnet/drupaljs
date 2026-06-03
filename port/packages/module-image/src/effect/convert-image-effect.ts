/**
 * Convert effect — changes the image format/extension.
 *
 * Ports `Drupal\image\Plugin\ImageEffect\ConvertImageEffect`.
 */
import type { ImageInterface, RenderableArray } from '../contracts.js';
import { ConfigurableImageEffectBase } from './image-effect-base.js';

export class ConvertImageEffect extends ConfigurableImageEffectBase {
  override defaultConfiguration(): Record<string, unknown> {
    return { extension: null };
  }

  applyEffect(image: ImageInterface): boolean {
    const extension = this.configuration['extension'] as string;
    if (!image.convert(extension)) {
      this.logger.error('Image convert failed', {
        '%toolkit': image.getToolkitId(),
        '%path': image.getSource(),
        '%mimetype': image.getMimeType(),
      });
      return false;
    }
    return true;
  }

  override getDerivativeExtension(_extension: string): string {
    return this.configuration['extension'] as string;
  }

  override getSummary(): RenderableArray {
    return {
      '#markup': String(this.configuration['extension'] ?? '').toUpperCase(),
      ...super.getSummary(),
    };
  }
}
