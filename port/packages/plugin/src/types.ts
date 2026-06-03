/**
 * Core type contracts for the Plugin API.
 *
 * Port of the interfaces under `Drupal\Component\Plugin\*`. PHP relies on
 * `class_exists` + dynamic `new $class(...)` for instantiation; in a JS/TS
 * runtime there is no class registry by name, so plugin definitions reference
 * their implementation via a {@link PluginConstructor} value (rather than a
 * class-name string). A `class` string MAY still be present for diagnostics.
 */

/**
 * A plugin definition.
 *
 * In Drupal a definition is "an array or an object implementing
 * PluginDefinitionInterface". Here it is an open record. The well-known keys
 * understood by the bundled discovery/factory are:
 *
 * - `id`        — the plugin ID (string).
 * - `class`     — the implementation constructor (preferred) or a string label.
 * - `deriver`   — an optional deriver: a {@link DeriverInterface} constructor or
 *                 instance, used by {@link DerivativeDiscoveryDecorator}.
 *
 * All other keys are subsystem-specific metadata and passed through verbatim.
 */
export interface PluginDefinition {
  id?: string;
  class?: PluginConstructor | string;
  deriver?: DeriverConstructor | DeriverInterface;
  [key: string]: unknown;
}

/** Anything we can `new` to build a plugin instance. */
export type PluginConstructor<T extends object = object> = new (
  configuration: Record<string, unknown>,
  pluginId: string,
  pluginDefinition: PluginDefinition,
) => T;

/** Constructor for a deriver, invoked with the base plugin ID. */
export type DeriverConstructor = new (basePluginId: string) => DeriverInterface;

/**
 * Minimum requirements for a plugin discovery component.
 *
 * @see \Drupal\Component\Plugin\Discovery\DiscoveryInterface
 */
export interface DiscoveryInterface {
  /**
   * Gets a specific plugin definition.
   *
   * @throws {PluginNotFoundException} if invalid and `exceptionOnInvalid` is true.
   */
  getDefinition(
    pluginId: string,
    exceptionOnInvalid?: boolean,
  ): PluginDefinition | null;

  /** Gets all plugin definitions keyed by plugin ID. */
  getDefinitions(): Record<string, PluginDefinition>;

  /** Indicates whether a specific plugin definition exists. */
  hasDefinition(pluginId: string): boolean;
}

/**
 * Factory implemented by all plugin factories.
 *
 * @see \Drupal\Component\Plugin\Factory\FactoryInterface
 */
export interface FactoryInterface {
  /**
   * Creates a plugin instance for the given ID and configuration.
   *
   * @throws {PluginException} if the instance cannot be created.
   */
  createInstance(
    pluginId: string,
    configuration?: Record<string, unknown>,
  ): object;
}

/**
 * Maps a plugin request (options) to an instance.
 *
 * @see \Drupal\Component\Plugin\Mapper\MapperInterface
 */
export interface MapperInterface {
  /** Gets or creates a plugin instance satisfying the given options. */
  getInstance(options: Record<string, unknown>): object | false;
}

/**
 * Interface implemented by plugin managers. Combines discovery, factory and
 * mapper concerns (Drupal enforces this via interface extension).
 *
 * @see \Drupal\Component\Plugin\PluginManagerInterface
 */
export interface PluginManagerInterface
  extends DiscoveryInterface,
    FactoryInterface,
    MapperInterface {}

/**
 * Discovery components that hold a cache of plugin definitions.
 *
 * @see \Drupal\Component\Plugin\Discovery\CachedDiscoveryInterface
 */
export interface CachedDiscoveryInterface extends DiscoveryInterface {
  /** Clears static and persistent plugin definition caches. */
  clearCachedDefinitions(): void;
  /** Enables or disables use of caches. */
  useCaches(useCaches?: boolean): void;
}

/**
 * Plugin managers with fallback behavior for missing plugins.
 *
 * @see \Drupal\Component\Plugin\FallbackPluginManagerInterface
 */
export interface FallbackPluginManagerInterface {
  /** Gets a fallback ID for a missing plugin. */
  getFallbackPluginId(
    pluginId: string,
    configuration?: Record<string, unknown>,
  ): string;
}

/**
 * Provides metadata inspection for a plugin instance.
 *
 * @see \Drupal\Component\Plugin\PluginInspectionInterface
 */
export interface PluginInspectionInterface {
  getPluginId(): string;
  getPluginDefinition(): PluginDefinition;
}

/**
 * Provides derivative metadata inspection for a plugin instance.
 *
 * @see \Drupal\Component\Plugin\DerivativeInspectionInterface
 */
export interface DerivativeInspectionInterface {
  getBaseId(): string;
  getDerivativeId(): string | null;
}

/**
 * Provides additional plugin definitions based on an existing definition.
 *
 * @see \Drupal\Component\Plugin\Derivative\DeriverInterface
 */
export interface DeriverInterface {
  /** Gets the definition of a single derivative, or null if absent. */
  getDerivativeDefinition(
    derivativeId: string,
    basePluginDefinition: PluginDefinition,
  ): PluginDefinition | null;

  /** Gets all derivative definitions keyed by derivative ID. */
  getDerivativeDefinitions(
    basePluginDefinition: PluginDefinition,
  ): Record<string, PluginDefinition>;
}

/**
 * A minimal cache backend used by {@link DefaultPluginManager} for its
 * definition cache.
 *
 * TODO(@drupaljs/cache): replace with the real `@drupaljs/cache` CacheBackend
 * contract once that package exists. This local shape is intentionally a strict
 * subset (get/set/delete) so it is forward-compatible.
 */
export interface DefinitionCacheBackend {
  get(key: string): Record<string, PluginDefinition> | undefined;
  set(key: string, definitions: Record<string, PluginDefinition>): void;
  delete(key: string): void;
}
