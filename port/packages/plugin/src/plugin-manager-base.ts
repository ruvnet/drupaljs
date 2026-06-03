import { PluginNotFoundException } from './exception.js';
import type {
  DiscoveryInterface,
  FactoryInterface,
  FallbackPluginManagerInterface,
  MapperInterface,
  PluginDefinition,
  PluginManagerInterface,
} from './types.js';

/**
 * Base class for plugin managers.
 *
 * Port of `Drupal\Component\Plugin\PluginManagerBase`. Brokers the discovery,
 * factory and mapper collaborators, implementing {@link PluginManagerInterface}
 * by proxying to them. Subclasses set `discovery`/`factory` (and optionally
 * `mapper`) in their constructor.
 */
export abstract class PluginManagerBase implements PluginManagerInterface {
  protected discovery!: DiscoveryInterface;
  protected factory!: FactoryInterface;
  protected mapper?: MapperInterface;

  protected getDiscovery(): DiscoveryInterface {
    return this.discovery;
  }

  protected getFactory(): FactoryInterface {
    return this.factory;
  }

  getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    return this.getDiscovery().getDefinition(pluginId, exceptionOnInvalid);
  }

  getDefinitions(): Record<string, PluginDefinition> {
    return this.getDiscovery().getDefinitions();
  }

  hasDefinition(pluginId: string): boolean {
    return this.getDiscovery().hasDefinition(pluginId);
  }

  createInstance(pluginId: string, configuration: Record<string, unknown> = {}): object {
    if (this.isFallbackManager()) {
      try {
        return this.getFactory().createInstance(pluginId, configuration);
      } catch (error) {
        if (error instanceof PluginNotFoundException) {
          return this.handlePluginNotFound(pluginId, configuration);
        }
        throw error;
      }
    }
    return this.getFactory().createInstance(pluginId, configuration);
  }

  getInstance(options: Record<string, unknown>): object | false {
    if (!this.mapper) {
      throw new Error(
        `${this.constructor.name} does not support getInstance() unless a mapper is set.`,
      );
    }
    return this.mapper.getInstance(options);
  }

  /** Resolves and instantiates a fallback plugin for a missing ID. */
  protected handlePluginNotFound(
    pluginId: string,
    configuration: Record<string, unknown>,
  ): object {
    const fallbackId = (this as unknown as FallbackPluginManagerInterface).getFallbackPluginId(
      pluginId,
      configuration,
    );
    return this.getFactory().createInstance(fallbackId, configuration);
  }

  /** Whether this manager opts into fallback behavior. */
  protected isFallbackManager(): this is this & FallbackPluginManagerInterface {
    return (
      typeof (this as Partial<FallbackPluginManagerInterface>).getFallbackPluginId === 'function'
    );
  }
}
