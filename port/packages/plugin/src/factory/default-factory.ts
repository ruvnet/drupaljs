import { PluginException } from '../exception.js';
import type {
  DiscoveryInterface,
  FactoryInterface,
  PluginConstructor,
  PluginDefinition,
} from '../types.js';

/**
 * Default plugin factory.
 *
 * Port of `Drupal\Component\Plugin\Factory\DefaultFactory`. Instantiates plugins
 * by calling their constructor with `(configuration, pluginId, pluginDefinition)`.
 *
 * Unlike PHP — which resolves a class-name string via `class_exists`/`new $class`
 * — JS has no global class registry by name, so the definition's `class` must be
 * an actual constructor value (see {@link PluginDefinition}). A required interface
 * is enforced with `instanceof` against a supplied base constructor.
 */
export class DefaultFactory implements FactoryInterface {
  protected discovery: DiscoveryInterface;
  protected interface: PluginConstructor | null;

  /**
   * @param discovery - Source of plugin definitions.
   * @param pluginInterface - Optional base constructor every plugin must extend.
   */
  constructor(discovery: DiscoveryInterface, pluginInterface: PluginConstructor | null = null) {
    this.discovery = discovery;
    this.interface = pluginInterface;
  }

  createInstance(pluginId: string, configuration: Record<string, unknown> = {}): object {
    const pluginDefinition = this.discovery.getDefinition(pluginId);
    const PluginClass = DefaultFactory.getPluginClass(
      pluginId,
      pluginDefinition,
      this.interface,
    );
    return new PluginClass(configuration, pluginId, pluginDefinition as PluginDefinition);
  }

  /**
   * Resolves the constructor for a plugin and validates it.
   *
   * @throws {PluginException} when no class is specified, the `class` value is
   *   not constructable, or it does not extend the required interface.
   */
  static getPluginClass(
    pluginId: string,
    pluginDefinition: PluginDefinition | null,
    requiredInterface: PluginConstructor | null = null,
  ): PluginConstructor {
    if (!pluginDefinition || pluginDefinition.class === undefined) {
      throw new PluginException(`The plugin (${pluginId}) did not specify an instance class.`);
    }

    const candidate = pluginDefinition.class;
    if (typeof candidate !== 'function') {
      throw new PluginException(
        `Plugin (${pluginId}) instance class "${String(candidate)}" is not a constructor. ` +
          'In the TS port a plugin definition must reference its class as a constructor value, not a name.',
      );
    }

    const ctor = candidate as PluginConstructor;

    if (requiredInterface && !(ctor.prototype instanceof requiredInterface) && ctor !== requiredInterface) {
      throw new PluginException(
        `Plugin "${pluginId}" (${ctor.name}) must be an instance of ${requiredInterface.name}.`,
      );
    }

    return ctor;
  }
}
