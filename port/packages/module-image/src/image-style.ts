/**
 * Image style configuration entity.
 *
 * Ports `Drupal\image\Entity\ImageStyle` from
 * core/modules/image/src/Entity/ImageStyle.php. The PHP entity resolves its
 * collaborators from the service container (`\Drupal::service(...)`); the TS
 * port injects them through the constructor so the entity is unit-testable
 * (TDD-London, ADR-0016) and free of global state.
 *
 * The effect *plugin collection* (`ImageEffectPluginCollection`) is inlined as
 * a simple ordered list here — faithful to its observable behaviour (sorted by
 * weight, add/remove by uuid) without the lazy-collection machinery.
 *
 * Routing/URL/token methods of the PHP entity (`buildUrl`, `getPathToken`,
 * `flush`) depend on unported subsystems (stream wrappers, file URL generator,
 * private key, cache tags) and are out of scope for this minimal slice; the
 * dimension/derivative/effect surface — the core of the module — is ported.
 *
 * @see core/modules/image/src/ImageStyleInterface.php
 */
import type {
  Dimensions,
  ImageEffectConfiguration,
  ImageEffectInterface,
  ImageFactoryInterface,
  ImageStyleInterface,
} from './contracts.js';
import { ImageEffectManager } from './image-effect-manager.js';

/** The stored shape of an image style config entity (config_export keys). */
export interface ImageStyleValues {
  name: string;
  label: string;
  /** Effects keyed by their instance uuid. */
  effects: Record<string, ImageEffectConfiguration>;
}

/** Constructor dependencies, injected for testability. */
export interface ImageStyleOptions {
  values: ImageStyleValues;
  effectManager: ImageEffectManager;
  imageFactory: ImageFactoryInterface;
  /** Generates a v4-style uuid for new effects. */
  uuidGenerator: () => string;
  /**
   * Default file scheme used when a source path has no scheme.
   *
   * TODO(@drupaljs/file-system): derive from system.file:default_scheme config.
   */
  defaultScheme?: string;
}

export class ImageStyle implements ImageStyleInterface {
  private name: string;
  private readonly _label: string;
  private effects: Record<string, ImageEffectConfiguration>;
  private readonly effectManager: ImageEffectManager;
  private readonly imageFactory: ImageFactoryInterface;
  private readonly uuidGenerator: () => string;
  private readonly defaultScheme: string;

  /** Lazily-built, weight-sorted effect instances. Invalidated on mutation. */
  private effectsCollection: ImageEffectInterface[] | null = null;

  constructor(options: ImageStyleOptions) {
    this.name = options.values.name;
    this._label = options.values.label;
    this.effects = { ...options.values.effects };
    this.effectManager = options.effectManager;
    this.imageFactory = options.imageFactory;
    this.uuidGenerator = options.uuidGenerator;
    this.defaultScheme = options.defaultScheme ?? 'public';
  }

  id(): string {
    return this.name;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  label(): string {
    return this._label;
  }

  // -- Effects -------------------------------------------------------------

  getEffects(): ImageEffectInterface[] {
    if (this.effectsCollection === null) {
      this.effectsCollection = Object.values(this.effects)
        .map((config) => this.effectManager.createInstance(config.id, config))
        .sort((a, b) => Number(a.getWeight()) - Number(b.getWeight()));
    }
    return this.effectsCollection;
  }

  getEffect(uuid: string): ImageEffectInterface | undefined {
    return this.getEffects().find((effect) => effect.getUuid() === uuid);
  }

  addImageEffect(configuration: Partial<ImageEffectConfiguration>): string {
    const uuid = this.uuidGenerator();
    if (configuration.id === undefined) {
      throw new Error('Cannot add an image effect without a plugin id.');
    }
    this.effects[uuid] = {
      uuid,
      id: configuration.id,
      weight: configuration.weight ?? 0,
      data: configuration.data ?? {},
    };
    this.invalidate();
    return uuid;
  }

  deleteImageEffect(effect: ImageEffectInterface): this {
    delete this.effects[effect.getUuid()];
    this.invalidate();
    return this;
  }

  // -- Dimension / extension transforms ------------------------------------

  transformDimensions(dimensions: Dimensions, uri: string): void {
    for (const effect of this.getEffects()) {
      effect.transformDimensions(dimensions, uri);
    }
  }

  getDerivativeExtension(extension: string): string {
    let result = extension;
    for (const effect of this.getEffects()) {
      result = effect.getDerivativeExtension(result);
    }
    return result;
  }

  // -- Derivative URI / generation -----------------------------------------

  buildUri(uri: string): string {
    const sourceScheme = getScheme(uri);
    let scheme: string;
    let path: string;
    if (sourceScheme) {
      scheme = sourceScheme;
      path = getTarget(uri);
      // Drupal recomputes the scheme for non-default sources based on stream
      // wrapper writability; without the stream wrapper subsystem we inherit
      // the source scheme (the common public/public case is exact).
      // TODO(@drupaljs/file-system): honour read-only wrapper fallback.
    } else {
      path = uri;
      scheme = this.defaultScheme;
    }
    return `${scheme}://styles/${this.id()}/${sourceScheme || this.defaultScheme}/${this.addExtension(path)}`;
  }

  createDerivative(originalUri: string, derivativeUri: string): boolean {
    const image = this.imageFactory.get(originalUri);
    // If the source file is invalid, bail without creating folders/derivatives.
    if (!image.isValid()) {
      return false;
    }
    // Directory preparation (file_system->prepareDirectory) is delegated to the
    // file-system package; in this slice we proceed straight to applying effects.
    for (const effect of this.getEffects()) {
      effect.applyEffect(image);
    }
    return image.save(derivativeUri);
  }

  getDerivativeUri(uri: string): string {
    return this.buildUri(uri);
  }

  supportsUri(uri: string): boolean {
    const extension = extensionOf(uri).toLowerCase();
    return this.imageFactory.getSupportedExtensions().includes(extension);
  }

  // -- Internal ------------------------------------------------------------

  /**
   * Adds the derivative extension to `path` when an effect changes it, so a
   * derivative of `x.png` converted to jpg becomes `x.png.jpg` (avoids name
   * clashes while keeping the source discoverable). Ports `addExtension()`.
   */
  private addExtension(path: string): string {
    const originalExtension = extensionOf(path);
    const extension = this.getDerivativeExtension(originalExtension);
    return originalExtension !== extension ? `${path}.${extension}` : path;
  }

  private invalidate(): void {
    this.effectsCollection = null;
  }
}

// -- Stream-wrapper URI helpers (subset) -----------------------------------
// TODO(@drupaljs/file-system): replace with StreamWrapperManager once ported.

/** Returns the scheme of a `scheme://target` URI, or null when absent. */
function getScheme(uri: string): string | null {
  const match = /^([\w-]+):\/\//.exec(uri);
  return match ? match[1]! : null;
}

/** Returns the target (the part after `scheme://`), or the whole string. */
function getTarget(uri: string): string {
  const index = uri.indexOf('://');
  return index === -1 ? uri : uri.slice(index + 3);
}

/** Returns the file extension of a path, without the dot. */
function extensionOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1);
}
