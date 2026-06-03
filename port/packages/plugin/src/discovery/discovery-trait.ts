import { PluginNotFoundException } from '../exception.js';
import type { PluginDefinition } from '../types.js';

/**
 * Shared `getDefinition` logic for discovery components.
 *
 * Port of `Drupal\Component\Plugin\Discovery\DiscoveryTrait::doGetDefinition()`.
 * TypeScript has no traits; discovery classes call this helper from their own
 * `getDefinition`/`hasDefinition` to avoid duplicating the lookup-or-throw rule.
 *
 * @param definitions - The full set of available definitions.
 * @param pluginId - The requested plugin ID.
 * @param exceptionOnInvalid - Throw vs. return null on a miss.
 * @param ownerName - Used to make the not-found message actionable.
 */
export function doGetDefinition(
  definitions: Record<string, PluginDefinition>,
  pluginId: string,
  exceptionOnInvalid: boolean,
  ownerName: string,
): PluginDefinition | null {
  const definition = definitions[pluginId];
  if (definition !== undefined) {
    return definition;
  }
  if (!exceptionOnInvalid) {
    return null;
  }
  const validIds = Object.keys(definitions).join(', ');
  throw new PluginNotFoundException(
    pluginId,
    `The "${pluginId}" plugin does not exist. Valid plugin IDs for ${ownerName} are: ${validIds}`,
  );
}
