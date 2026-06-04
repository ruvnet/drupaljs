/**
 * Public contracts for the Image module.
 *
 * Ported from `Drupal\image` (Drupal 11 core,
 * core/modules/image/src). PHP relies on services resolved from the container
 * (`\Drupal::service(...)`), `\Traversable` plugin discovery, and the Image
 * toolkit. In the TS port those collaborators are explicit interfaces injected
 * through constructors so they can be mocked (TDD-London, ADR-0016).
 *
 * Toolkit / file-system / render types belong to subsystems that are not yet
 * ported; they are represented here by minimal local contracts marked with a
 * TODO so this package compiles and tests in isolation.
 *
 * @see core/modules/image/src/ImageEffectInterface.php
 * @see core/modules/image/src/ImageStyleInterface.php
 */

/**
 * A mutable set of image dimensions, in pixels.
 *
 * Both values may be `null` when unknown (e.g. after a random rotation). Ported
 * from the `&$dimensions` array passed by reference throughout the image system.
 */
export interface Dimensions {
  width: number | null;
  height: number | null;
}

/**
 * A render array.
 *
 * TODO(@drupaljs/render): replace with the real render-array contract once the
 * render package exposes one. For now this is an open record.
 */
export type RenderableArray = Record<string, unknown>;

/**
 * Minimal logger contract used by image effects.
 *
 * Ports the `Psr\Log\LoggerInterface` surface the effects actually use.
 *
 * TODO(@drupaljs/logger): replace with the shared LoggerInterface once the
 * logger package lands.
 */
export interface LoggerInterface {
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * A toolkit-backed image being transformed.
 *
 * Ports the operations of `Drupal\Core\Image\ImageInterface` that the bundled
 * effects invoke. The concrete toolkit (GD/ImageMagick) is a deep external
 * dependency; this contract lets effects be unit-tested against a mock.
 *
 * TODO(@drupaljs/image-toolkit): replace with the real ImageInterface once the
 * toolkit package lands.
 */
export interface ImageInterface {
  isValid(): boolean;
  getWidth(): number | null;
  getHeight(): number | null;
  getToolkitId(): string;
  getSource(): string;
  getMimeType(): string;
  resize(width: number, height: number): boolean;
  scale(width: number | null, height: number | null, upscale?: boolean): boolean;
  crop(x: number, y: number, width: number, height: number | null): boolean;
  rotate(degrees: number, background?: string | null): boolean;
  desaturate(): boolean;
  convert(extension: string): boolean;
  /** Generic toolkit operation dispatch (used by scale_and_crop). */
  apply(operation: string, args: Record<string, unknown>): boolean;
  save(destination: string): boolean;
}

/**
 * Produces {@link ImageInterface} instances from a file URI.
 *
 * Ports the slice of `Drupal\Core\Image\ImageFactory` that {@link ImageStyle}
 * uses to build derivatives.
 *
 * TODO(@drupaljs/image-toolkit): replace with the real ImageFactory.
 */
export interface ImageFactoryInterface {
  get(uri: string): ImageInterface;
  getSupportedExtensions(): string[];
}

/**
 * Interface for image effects.
 *
 * Ports `Drupal\image\ImageEffectInterface`. The Drupal interface also extends
 * `ConfigurableInterface` / `PluginInspectionInterface`; the relevant members
 * are folded in here so the port stays single-package.
 *
 * @see core/modules/image/src/ImageEffectInterface.php
 */
export interface ImageEffectInterface {
  /** Applies the effect to the image; returns false on toolkit failure. */
  applyEffect(image: ImageInterface): boolean;
  /** Mutates `dimensions` to reflect the effect, without touching the image. */
  transformDimensions(dimensions: Dimensions, uri: string): void;
  /** Returns the file extension after applying the effect. */
  getDerivativeExtension(extension: string): string;
  /** A render array summarising the effect configuration. */
  getSummary(): RenderableArray;
  /** The human-readable effect label (from the plugin definition). */
  label(): string;
  /** The plugin id (e.g. "image_scale"). */
  getPluginId(): string;
  /** The unique instance id within an image style. */
  getUuid(): string;
  /** The effect weight (ordering within a style). */
  getWeight(): number | string;
  setWeight(weight: number | string): this;
  /** Effect-specific configuration (the `data` bag). */
  getConfiguration(): ImageEffectConfiguration;
  setConfiguration(configuration: Partial<ImageEffectConfiguration>): this;
}

/**
 * Stored configuration for a single effect instance within an image style.
 *
 * Ports the array returned by `ImageEffectBase::getConfiguration()`.
 */
export interface ImageEffectConfiguration {
  uuid: string;
  id: string;
  weight: number | string;
  data: Record<string, unknown>;
}

/**
 * Static side of an image effect plugin (the class object).
 *
 * The plugin manager calls `defaultConfiguration()` indirectly via the
 * constructor; the constructor mirrors Drupal's
 * `(configuration, plugin_id, plugin_definition, logger)` signature.
 */
export interface ImageEffectConstructor {
  new (
    configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: ImageEffectPluginDefinition,
    logger: LoggerInterface,
  ): ImageEffectInterface;
}

/**
 * An image-effect plugin definition.
 *
 * Ports `Drupal\image\Attribute\ImageEffect`. Discovery is registration-based
 * (TS-idiomatic equivalent of PHP attribute scanning), so the implementation
 * class is referenced directly.
 *
 * @see core/modules/image/src/Attribute/ImageEffect.php
 */
export interface ImageEffectPluginDefinition {
  id: string;
  label: string;
  description?: string;
  /** Set by the manager to the providing module's machine name. */
  provider?: string;
  /** The effect implementation constructor. */
  class: ImageEffectConstructor;
  [key: string]: unknown;
}

/**
 * Interface defining an image style configuration entity.
 *
 * Ports `Drupal\image\ImageStyleInterface`. Routing/URL/token methods that
 * depend on unported subsystems (stream wrappers, file URL generator, private
 * key) are omitted from this minimal slice; the dimension/derivative/effect
 * surface — the heart of the module — is faithful.
 *
 * @see core/modules/image/src/ImageStyleInterface.php
 */
export interface ImageStyleInterface {
  id(): string;
  getName(): string;
  setName(name: string): this;
  label(): string;

  /** Returns the effects for this style, ordered by ascending weight. */
  getEffects(): ImageEffectInterface[];
  /** Returns a single effect by its instance uuid, or undefined. */
  getEffect(uuid: string): ImageEffectInterface | undefined;
  /** Adds an effect from stored configuration; returns the generated uuid. */
  addImageEffect(configuration: Partial<ImageEffectConfiguration>): string;
  /** Removes an effect by instance, returning the style for chaining. */
  deleteImageEffect(effect: ImageEffectInterface): this;

  /** Applies every effect's dimension transform in order. */
  transformDimensions(dimensions: Dimensions, uri: string): void;
  /** Computes the derivative extension after all effects. */
  getDerivativeExtension(extension: string): string;
  /** Builds the derivative URI for an original image uri/path. */
  buildUri(uri: string): string;
  /** Generates an image derivative by applying all effects and saving it. */
  createDerivative(originalUri: string, derivativeUri: string): boolean;
  /** True when the style supports the file at `uri` (by extension). */
  supportsUri(uri: string): boolean;
}

/** The query-parameter name for image derivative tokens (`ImageStyleInterface::TOKEN`). */
export const TOKEN = 'itok';

/** The admin permission machine name, from image.permissions.yml. */
export const ADMINISTER_IMAGE_STYLES = 'administer image styles';
