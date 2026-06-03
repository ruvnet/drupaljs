/**
 * Search plugin subsystem.
 *
 * Ports the core pieces of Drupal's search plugin system
 * (`Drupal\search\Plugin\SearchPluginBase`,
 * `Drupal\search\Plugin\SearchInterface` and the SearchPluginManager) to a
 * minimal, dependency-free TypeScript surface. Drupal core's PHP source for the
 * search module was not available locally at port time, so this implementation
 * follows the public contract exercised by the accompanying tests, which mirror
 * the documented Drupal API.
 */

/** Loosely-typed plugin configuration bag. */
export type SearchConfiguration = Record<string, unknown>;

/** Query parameters carried alongside a search request (e.g. paging). */
export type SearchParameters = Record<string, string>;

/** Request attributes available to a search plugin. */
export type SearchAttributes = Record<string, unknown>;

/**
 * A single search hit. Ports the minimal shape of an item returned from
 * `SearchInterface::execute()`. Only `link` and `title` are modelled directly;
 * plugins may add arbitrary extra keys.
 */
export interface SearchResult {
  link?: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * A render-array entry for a single result, as produced by
 * `SearchInterface::buildResults()`.
 */
export interface SearchResultRenderItem {
  '#theme': 'search_result';
  '#result': SearchResult;
  '#plugin_id': string;
}

/**
 * Declarative metadata for a search plugin. Ports the subset of a Drupal
 * `@SearchPlugin` annotation/attribute used here, plus a `factory` that knows
 * how to instantiate the concrete plugin class.
 *
 * TODO(@drupaljs/plugin): replace the bespoke `factory` with the shared plugin
 * discovery/instantiation mechanism once `@drupaljs/plugin` lands.
 */
export interface SearchPluginDefinition {
  /** The plugin's machine id. */
  id: string;
  /** Human-readable admin title. */
  title: string;
  /** Whether result pages should render with the admin theme. */
  use_admin_theme?: boolean;
  /** Builds a concrete plugin instance from config + plugin id. */
  factory: (configuration: SearchConfiguration, pluginId: string) => SearchPluginInterface;
}

/**
 * The public contract of a search plugin. Ports
 * `Drupal\search\Plugin\SearchInterface` (reduced to what is in use).
 */
export interface SearchPluginInterface {
  setSearch(keywords: string, parameters: SearchParameters, attributes: SearchAttributes): this;
  getKeywords(): string;
  getParameters(): SearchParameters;
  getAttributes(): SearchAttributes;
  isSearchExecutable(): boolean;
  getType(): string | null;
  execute(): SearchResult[];
  buildResults(): SearchResultRenderItem[];
  suggestedTitle(): string;
  usesAdminTheme(): boolean;
  getPluginId(): string;
  getPluginDefinition(): SearchPluginDefinition;
  getConfiguration(): SearchConfiguration;
}

/**
 * Abstract base providing the boilerplate shared by every search plugin.
 * Ports `Drupal\search\Plugin\SearchPluginBase`.
 *
 * Concrete subclasses must implement {@link getType} and {@link execute}; they
 * may override {@link isSearchExecutable}, {@link suggestedTitle}, etc.
 */
export abstract class SearchPluginBase implements SearchPluginInterface {
  protected keywords = '';
  protected searchParameters: SearchParameters = {};
  protected searchAttributes: SearchAttributes = {};

  constructor(
    protected readonly configuration: SearchConfiguration,
    protected readonly pluginId: string,
    protected readonly pluginDefinition: SearchPluginDefinition,
  ) {}

  setSearch(keywords: string, parameters: SearchParameters, attributes: SearchAttributes): this {
    // Drupal coerces keywords to a string; mirror that for parity.
    this.keywords = String(keywords ?? '');
    this.searchParameters = parameters ?? {};
    this.searchAttributes = attributes ?? {};
    return this;
  }

  getKeywords(): string {
    return this.keywords;
  }

  getParameters(): SearchParameters {
    return this.searchParameters;
  }

  getAttributes(): SearchAttributes {
    return this.searchAttributes;
  }

  /** Executable when there are non-empty keywords. */
  isSearchExecutable(): boolean {
    return this.keywords !== '';
  }

  abstract getType(): string | null;

  abstract execute(): SearchResult[];

  /** Wraps each {@link execute} result in a `search_result` render array. */
  buildResults(): SearchResultRenderItem[] {
    return this.execute().map((result) => ({
      '#theme': 'search_result',
      '#result': result,
      '#plugin_id': this.pluginId,
    }));
  }

  /** A page title suggested from the active keywords. */
  suggestedTitle(): string {
    return this.keywords !== '' ? `Search for ${this.keywords}` : 'Search';
  }

  /** Whether result pages should use the admin theme (definition-driven). */
  usesAdminTheme(): boolean {
    return this.pluginDefinition.use_admin_theme === true;
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): SearchPluginDefinition {
    return this.pluginDefinition;
  }

  getConfiguration(): SearchConfiguration {
    return this.configuration;
  }
}

/**
 * A plugin that can (re)index content for searching. Ports
 * `Drupal\search\Plugin\SearchIndexingInterface`. Implemented structurally — a
 * plugin opts in simply by providing these methods.
 */
export interface SearchIndexingInterface {
  updateIndex(): void;
}

/** Structural test for whether a plugin supports indexing. */
export function isSearchIndexing(
  plugin: SearchPluginInterface,
): plugin is SearchPluginInterface & SearchIndexingInterface {
  return typeof (plugin as Partial<SearchIndexingInterface>).updateIndex === 'function';
}

/**
 * Registry + factory for search plugin definitions. Ports the role of
 * `Drupal\search\SearchPluginManager` (the discovery part is replaced by
 * explicit registration since plugin discovery is not yet ported).
 */
export class SearchPluginManager {
  private readonly definitions = new Map<string, SearchPluginDefinition>();

  /** Register (or replace) a plugin definition keyed by its id. */
  registerDefinition(definition: SearchPluginDefinition): this {
    this.definitions.set(definition.id, definition);
    return this;
  }

  /** True when a definition with the given id is registered. */
  hasDefinition(pluginId: string): boolean {
    return this.definitions.has(pluginId);
  }

  /** All registered definitions as a plain keyed object. */
  getDefinitions(): Record<string, SearchPluginDefinition> {
    return Object.fromEntries(this.definitions);
  }

  /** Fetch a definition, throwing if the id is unknown. */
  getDefinition(pluginId: string): SearchPluginDefinition {
    const definition = this.definitions.get(pluginId);
    if (!definition) {
      throw new Error(`Unknown search plugin: ${pluginId}`);
    }
    return definition;
  }

  /** Instantiate a plugin from a registered definition. */
  createInstance(pluginId: string, configuration: SearchConfiguration = {}): SearchPluginInterface {
    const definition = this.getDefinition(pluginId);
    return definition.factory(configuration, pluginId);
  }
}
