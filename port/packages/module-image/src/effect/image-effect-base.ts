/**
 * Base class for image effects.
 *
 * Ports `Drupal\image\ImageEffectBase` (+ `ConfigurableImageEffectBase`) from
 * core/modules/image/src/ImageEffectBase.php. Form-building methods of the PHP
 * base are omitted from this slice (the Form API is a separate package); the
 * configuration / dimension / extension surface is faithful.
 */

import type {
  Dimensions,
  ImageEffectConfiguration,
  ImageEffectInterface,
  ImageEffectPluginDefinition,
  ImageInterface,
  LoggerInterface,
  RenderableArray,
} from '../contracts.js';

export abstract class ImageEffectBase implements ImageEffectInterface {
  protected configuration: Record<string, unknown>;
  protected uuid = '';
  protected weight: number | string = '';
  protected readonly logger: LoggerInterface;

  constructor(
    configuration: Record<string, unknown>,
    protected readonly pluginId: string,
    protected readonly pluginDefinition: ImageEffectPluginDefinition,
    logger: LoggerInterface,
  ) {
    this.logger = logger;
    // Drupal's ConfigurablePluginBase merges incoming config over defaults.
    this.configuration = { ...this.defaultConfiguration(), ...configuration };
  }

  abstract applyEffect(image: ImageInterface): boolean;

  /** Default configuration; subclasses override with their settings. */
  defaultConfiguration(): Record<string, unknown> {
    return {};
  }

  /**
   * Most effects don't change dimensions. Subclasses override as needed.
   */
  transformDimensions(_dimensions: Dimensions, _uri: string): void {
    // No-op by default.
  }

  /** Most effects don't change the extension. */
  getDerivativeExtension(extension: string): string {
    return extension;
  }

  getSummary(): RenderableArray {
    return {
      '#markup': '',
      '#effect': {
        id: this.pluginDefinition.id,
        label: this.label(),
        description: this.pluginDefinition.description,
      },
    };
  }

  label(): string {
    return this.pluginDefinition.label;
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getUuid(): string {
    return this.uuid;
  }

  getWeight(): number | string {
    return this.weight;
  }

  setWeight(weight: number | string): this {
    this.weight = weight;
    return this;
  }

  getConfiguration(): ImageEffectConfiguration {
    return {
      uuid: this.uuid,
      id: this.getPluginId(),
      weight: this.weight,
      data: this.configuration,
    };
  }

  setConfiguration(configuration: Partial<ImageEffectConfiguration>): this {
    const data = configuration.data ?? {};
    this.configuration = { ...this.defaultConfiguration(), ...data };
    this.uuid = configuration.uuid ?? '';
    this.weight = configuration.weight ?? '';
    return this;
  }
}

/**
 * Base for configurable effects.
 *
 * Ports `Drupal\image\ConfigurableImageEffectBase`. The PHP class adds
 * (no-op-by-default) form validate/submit hooks; those belong to the Form API
 * package and are intentionally omitted here.
 */
export abstract class ConfigurableImageEffectBase extends ImageEffectBase {}
