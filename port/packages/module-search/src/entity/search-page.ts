/**
 * SearchPage configuration entity.
 *
 * Ports `Drupal\search\Entity\SearchPage` to a minimal, dependency-free
 * TypeScript surface. A search page binds a route/path to a configured search
 * plugin instance and carries enable/weight/label metadata. Drupal core's PHP
 * source was not available locally at port time; this follows the public
 * contract exercised by the accompanying tests, which mirror the documented
 * Drupal API.
 */

import {
  SearchPluginManager,
  isSearchIndexing,
  type SearchConfiguration,
  type SearchPluginInterface,
} from '../plugin/search-plugin.js';

/**
 * Stored configuration values for a search page. Mirrors the `config_export`
 * keys of the real `search.page.*` config entity.
 */
export interface SearchPageValues {
  /** The config entity machine id. */
  id: string;
  /** Human-readable label. */
  label?: string;
  /** The path fragment the page is served from. */
  path?: string;
  /** Sort weight relative to other pages. */
  weight?: number;
  /** Whether the page is enabled. */
  status?: boolean;
  /** The search plugin id this page uses. */
  plugin: string;
  /** Plugin-specific configuration. */
  configuration?: SearchConfiguration;
}

/** Config-export key order, matching the entity's `config_export` definition. */
const CONFIG_EXPORT_KEYS = ['id', 'label', 'path', 'weight', 'plugin', 'configuration'] as const;

export class SearchPage {
  private readonly values: SearchPageValues;
  private pluginInstance: SearchPluginInterface | null = null;

  constructor(
    values: SearchPageValues,
    private readonly pluginManager: SearchPluginManager,
  ) {
    this.values = { ...values };
  }

  /** The config entity id. */
  id(): string {
    return this.values.id;
  }

  /** The human-readable label (defaults to empty string). */
  label(): string {
    return this.values.label ?? '';
  }

  /** The served path fragment (defaults to empty string). */
  getPath(): string {
    return this.values.path ?? '';
  }

  /** The sort weight (defaults to 0). */
  getWeight(): number {
    return this.values.weight ?? 0;
  }

  /** Whether the page is enabled (defaults to true). */
  status(): boolean {
    return this.values.status ?? true;
  }

  /** The configured search plugin id. */
  getPluginId(): string {
    return this.values.plugin;
  }

  /**
   * Lazily instantiate and memoise the configured search plugin, seeded with
   * the page's plugin configuration.
   */
  getPlugin(): SearchPluginInterface {
    if (this.pluginInstance === null) {
      this.pluginInstance = this.pluginManager.createInstance(
        this.values.plugin,
        this.values.configuration ?? {},
      );
    }
    return this.pluginInstance;
  }

  /** Swap the active plugin id and reset the cached plugin instance. */
  setPlugin(pluginId: string): this {
    this.values.plugin = pluginId;
    this.pluginInstance = null;
    return this;
  }

  /**
   * A page is indexable when it is enabled and its plugin implements the
   * indexing interface.
   */
  isIndexable(): boolean {
    return this.status() && isSearchIndexing(this.getPlugin());
  }

  /** Export the entity to its stored `config_export` representation. */
  toConfigArray(): Partial<SearchPageValues> {
    const out: Partial<SearchPageValues> = {};
    for (const key of CONFIG_EXPORT_KEYS) {
      if (this.values[key] !== undefined) {
        // Index access is safe: keys are a const subset of SearchPageValues.
        (out as Record<string, unknown>)[key] = this.values[key];
      }
    }
    return out;
  }

  /**
   * Comparator ordering enabled pages before disabled, then by ascending
   * weight, then alphabetically by label. Ports `SearchPage::sort()`.
   */
  static sort(a: SearchPage, b: SearchPage): number {
    if (a.status() !== b.status()) {
      // Enabled (true) sorts before disabled (false).
      return a.status() ? -1 : 1;
    }
    if (a.getWeight() !== b.getWeight()) {
      return a.getWeight() - b.getWeight();
    }
    return a.label().localeCompare(b.label());
  }
}
