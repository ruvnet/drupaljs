import type {
  DerivativeInspectionInterface,
  PluginDefinition,
  PluginInspectionInterface,
} from './types.js';

/**
 * Base class for plugins supporting metadata inspection.
 *
 * Port of `Drupal\Component\Plugin\PluginBase`. Subclasses receive the standard
 * constructor signature `(configuration, pluginId, pluginDefinition)` used by
 * {@link DefaultFactory}.
 */
export abstract class PluginBase
  implements PluginInspectionInterface, DerivativeInspectionInterface
{
  /** Separates a base plugin ID from its derivative ID. */
  static readonly DERIVATIVE_SEPARATOR = ':';

  protected configuration: Record<string, unknown>;
  protected pluginId: string;
  protected pluginDefinition: PluginDefinition;

  constructor(
    configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: PluginDefinition,
  ) {
    this.configuration = configuration;
    this.pluginId = pluginId;
    this.pluginDefinition = pluginDefinition;
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): PluginDefinition {
    return this.pluginDefinition;
  }

  getBaseId(): string {
    const separator = PluginBase.DERIVATIVE_SEPARATOR;
    const index = this.pluginId.indexOf(separator);
    return index > 0 ? this.pluginId.slice(0, index) : this.pluginId;
  }

  getDerivativeId(): string | null {
    const separator = PluginBase.DERIVATIVE_SEPARATOR;
    const index = this.pluginId.indexOf(separator);
    return index > 0 ? this.pluginId.slice(index + 1) : null;
  }
}
