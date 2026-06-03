/**
 * The `menu_link_content` menu link plugin.
 *
 * Ports `Drupal\menu_link_content\Plugin\Menu\MenuLinkContent` — the runtime
 * menu-tree plugin that wraps a menu_link_content entity. The PHP version pulls
 * its collaborators (entity type manager, language manager, entity repository)
 * from the service container; here they are injected as a lazy entity loader
 * plus optional save/delete callbacks, which is the TS-idiomatic equivalent.
 */

import type { MenuLinkContent } from './entity.js';
import type { MenuLinkPluginDefinition } from './types.js';

/** Optional persistence callbacks for the wrapped entity. */
export interface MenuLinkContentPluginHandlers {
  /** Called by {@link MenuLinkContentPlugin.deleteLink}. */
  onDelete?: (entity: MenuLinkContent) => void;
  /** Called by {@link MenuLinkContentPlugin.updateLink} when persisting. */
  onSave?: (entity: MenuLinkContent) => void;
}

/**
 * The subset of definition keys a caller is allowed to override via
 * {@link MenuLinkContentPlugin.updateLink}. Mirrors `$overrideAllowed`.
 */
const OVERRIDE_ALLOWED: ReadonlySet<string> = new Set([
  'menu_name',
  'parent',
  'weight',
  'expanded',
  'enabled',
  'title',
  'description',
  'route_name',
  'route_parameters',
  'url',
  'options',
]);

export class MenuLinkContentPlugin {
  private pluginDefinition: MenuLinkPluginDefinition;
  private entity?: MenuLinkContent;

  constructor(
    pluginDefinition: MenuLinkPluginDefinition,
    /** Lazy loader; only invoked when the entity is actually needed. */
    private readonly loadEntity: () => MenuLinkContent,
    private readonly handlers: MenuLinkContentPluginHandlers = {},
  ) {
    this.pluginDefinition = pluginDefinition;
  }

  /** Lazily loads, marks-inside-plugin and caches the wrapped entity. */
  getEntity(): MenuLinkContent {
    if (!this.entity) {
      const entity = this.loadEntity();
      entity.setInsidePlugin();
      this.entity = entity;
    }
    return this.entity;
  }

  getPluginDefinition(): MenuLinkPluginDefinition {
    return this.pluginDefinition;
  }

  getTitle(): string {
    return this.pluginDefinition.title;
  }

  getDescription(): string {
    return this.pluginDefinition.description;
  }

  getWeight(): number {
    return this.pluginDefinition.weight;
  }

  getParent(): string {
    return this.pluginDefinition.parent;
  }

  isEnabled(): boolean {
    return this.pluginDefinition.enabled === 1;
  }

  isExpanded(): boolean {
    return this.pluginDefinition.expanded === 1;
  }

  isDeletable(): boolean {
    return true;
  }

  isTranslatable(): boolean {
    return this.getEntity().isTranslatable();
  }

  /** Ports `deleteLink()`. */
  deleteLink(): void {
    const entity = this.getEntity();
    this.handlers.onDelete?.(entity);
  }

  /**
   * Ports `updateLink()`: filters to override-allowed keys, merges them over the
   * current definition, and — when persisting — writes them back to the entity.
   */
  updateLink(
    newDefinitionValues: Partial<MenuLinkPluginDefinition>,
    persist: boolean,
  ): MenuLinkPluginDefinition {
    const overrides: Partial<MenuLinkPluginDefinition> = {};
    for (const [key, value] of Object.entries(newDefinitionValues)) {
      if (OVERRIDE_ALLOWED.has(key)) {
        (overrides as Record<string, unknown>)[key] = value;
      }
    }

    this.pluginDefinition = { ...this.pluginDefinition, ...overrides };

    if (persist) {
      const entity = this.getEntity();
      for (const [key, value] of Object.entries(overrides)) {
        entity.setFieldValue(key, value);
      }
      this.handlers.onSave?.(entity);
    }

    return this.pluginDefinition;
  }
}
