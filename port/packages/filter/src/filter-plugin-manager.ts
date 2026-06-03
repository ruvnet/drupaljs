import {
  StaticDiscovery,
  DefaultFactory,
  type FallbackPluginManagerInterface,
  type PluginManagerInterface,
  type PluginDefinition,
} from '@drupaljs/plugin';
import { FilterBase } from './filter-base.js';
import type { FilterInterface } from './types.js';

/**
 * Manages text-processing filter plugins.
 *
 * Port of `Drupal\filter\FilterPluginManager`. Drupal's version extends
 * `DefaultPluginManager` (which scans `Plugin/Filter` namespaces with a cache
 * backend + alter hook). Until that filesystem/namespace discovery exists in
 * the TS port, this manager is registration-based: modules register their
 * filter definitions via {@link registerDefinition}, mirroring the
 * `StaticDiscovery` style used elsewhere in the port. Instances are built by
 * the standard plugin {@link DefaultFactory}, validated against {@link FilterBase}.
 *
 * @see core/modules/filter/src/FilterPluginManager.php
 */
export class FilterPluginManager
  implements PluginManagerInterface, FallbackPluginManagerInterface
{
  private readonly discovery = new StaticDiscovery();
  private readonly factory = new DefaultFactory(
    this.discovery,
    FilterBase as unknown as new (
      configuration: Record<string, unknown>,
      pluginId: string,
      pluginDefinition: PluginDefinition,
    ) => object,
  );

  /** Registers (or replaces) a filter plugin definition. */
  registerDefinition(pluginId: string, definition: PluginDefinition): void {
    this.discovery.setDefinition(pluginId, { ...definition, id: pluginId });
  }

  getDefinition(
    pluginId: string,
    exceptionOnInvalid = true,
  ): PluginDefinition | null {
    return this.discovery.getDefinition(pluginId, exceptionOnInvalid);
  }

  getDefinitions(): Record<string, PluginDefinition> {
    return this.discovery.getDefinitions();
  }

  hasDefinition(pluginId: string): boolean {
    return this.discovery.hasDefinition(pluginId);
  }

  createInstance(
    pluginId: string,
    configuration: Record<string, unknown> = {},
  ): FilterInterface {
    return this.factory.createInstance(pluginId, configuration) as FilterInterface;
  }

  /** {@link MapperInterface} — not used by the filter subsystem. */
  getInstance(options: Record<string, unknown>): object | false {
    const id = options.id;
    if (typeof id !== 'string') return false;
    return this.createInstance(
      id,
      (options.configuration as Record<string, unknown>) ?? {},
    );
  }

  /** The fallback filter is `filter_null` (a passthrough). */
  getFallbackPluginId(
    _pluginId?: string,
    _configuration?: Record<string, unknown>,
  ): string {
    return 'filter_null';
  }
}
