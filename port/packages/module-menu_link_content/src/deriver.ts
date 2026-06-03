/**
 * Deriver for user-entered menu link paths.
 *
 * Ports `Drupal\menu_link_content\Plugin\Deriver\MenuLinkContentDeriver`: it
 * yields one menu-link plugin definition per menu_link_content entity that is
 * flagged for rediscovery, keyed by entity UUID.
 */

import type { EntityTypeManagerInterface, MenuLinkPluginDefinition } from './types.js';

export class MenuLinkContentDeriver {
  constructor(private readonly entityTypeManager: EntityTypeManagerInterface) {}

  /** Ports `getDerivativeDefinitions()`. */
  getDerivativeDefinitions(
    _basePluginDefinition: Partial<MenuLinkPluginDefinition>,
  ): Record<string, MenuLinkPluginDefinition> {
    const storage = this.entityTypeManager.getStorage('menu_link_content');
    const entities = storage.loadByProperties({ rediscover: true });

    const definitions: Record<string, MenuLinkPluginDefinition> = {};
    for (const entity of entities) {
      definitions[entity.getUuid()] = entity.getPluginDefinition();
    }
    return definitions;
  }
}
