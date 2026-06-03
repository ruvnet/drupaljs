/**
 * Image effect plugin manager.
 *
 * Ports `Drupal\image\ImageEffectManager` (a `DefaultPluginManager`). Drupal
 * discovers effect plugins by scanning `Plugin/ImageEffect` namespaces for
 * `#[ImageEffect]` attributes; following the same convention as @drupaljs/hook,
 * this port replaces attribute scanning with an explicit **registration API**
 * (`registerDefinition`). Instances are produced via the constructor factory,
 * mirroring `DefaultFactory`.
 *
 * @see core/modules/image/src/ImageEffectManager.php
 */
import type {
  ImageEffectConfiguration,
  ImageEffectInterface,
  ImageEffectPluginDefinition,
  LoggerInterface,
} from './contracts.js';

/**
 * Thrown when an image effect plugin id is not registered.
 *
 * Mirrors `Drupal\Component\Plugin\Exception\PluginNotFoundException`.
 *
 * TODO(@drupaljs/plugin): re-export the shared PluginNotFoundException once
 * this manager is rebased onto DefaultPluginManager.
 */
export class PluginNotFoundException extends Error {
  constructor(pluginId: string) {
    super(`The "${pluginId}" plugin does not exist.`);
    this.name = 'PluginNotFoundException';
  }
}

export class ImageEffectManager {
  private readonly definitions = new Map<string, ImageEffectPluginDefinition>();

  /**
   * @param logger Channel injected into every effect instance
   *   (Drupal's `logger.channel.image`).
   */
  constructor(private readonly logger: LoggerInterface) {}

  /** Registers an effect plugin definition (replaces attribute discovery). */
  registerDefinition(definition: ImageEffectPluginDefinition): this {
    this.definitions.set(definition.id, definition);
    return this;
  }

  getDefinitions(): Record<string, ImageEffectPluginDefinition> {
    return Object.fromEntries(this.definitions);
  }

  hasDefinition(pluginId: string): boolean {
    return this.definitions.has(pluginId);
  }

  getDefinition(pluginId: string): ImageEffectPluginDefinition {
    const definition = this.definitions.get(pluginId);
    if (definition === undefined) {
      throw new PluginNotFoundException(pluginId);
    }
    return definition;
  }

  /**
   * Creates a configured effect instance.
   *
   * @param pluginId The effect plugin id.
   * @param configuration Stored effect configuration (uuid/weight/data).
   */
  createInstance(
    pluginId: string,
    configuration: Partial<ImageEffectConfiguration> = {},
  ): ImageEffectInterface {
    const definition = this.getDefinition(pluginId);
    const data = configuration.data ?? {};
    const instance = new definition.class(data, pluginId, definition, this.logger);
    instance.setConfiguration({
      uuid: configuration.uuid ?? '',
      id: pluginId,
      weight: configuration.weight ?? 0,
      data,
    });
    return instance;
  }
}
