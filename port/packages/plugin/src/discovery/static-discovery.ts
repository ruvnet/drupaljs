import type { DiscoveryInterface, PluginDefinition } from '../types.js';
import { doGetDefinition } from './discovery-trait.js';

/**
 * Allows plugin definitions to be manually registered.
 *
 * Port of `Drupal\Component\Plugin\Discovery\StaticDiscovery`. This is the
 * registration-based discovery: code calls {@link setDefinition} to add plugins
 * imperatively (e.g. from a module's bootstrap), rather than scanning files.
 */
export class StaticDiscovery implements DiscoveryInterface {
  protected definitions: Record<string, PluginDefinition> = {};

  getDefinitions(): Record<string, PluginDefinition> {
    return this.definitions;
  }

  getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    return doGetDefinition(
      this.getDefinitions(),
      pluginId,
      exceptionOnInvalid,
      this.constructor.name,
    );
  }

  hasDefinition(pluginId: string): boolean {
    return this.getDefinition(pluginId, false) !== null;
  }

  /** Registers (or replaces) a plugin definition. */
  setDefinition(pluginId: string, definition: PluginDefinition): void {
    this.definitions[pluginId] = definition;
  }

  /** Removes a previously registered plugin definition. */
  deleteDefinition(pluginId: string): void {
    delete this.definitions[pluginId];
  }
}
