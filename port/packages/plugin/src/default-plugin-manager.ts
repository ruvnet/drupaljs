import { DefaultFactory } from './factory/default-factory.js';
import { DerivativeDiscoveryDecorator } from './discovery/derivative-discovery-decorator.js';
import { ManifestDiscovery, type Manifest } from './discovery/manifest-discovery.js';
import { PluginManagerBase } from './plugin-manager-base.js';
import { doGetDefinition } from './discovery/discovery-trait.js';
import type {
  CachedDiscoveryInterface,
  DefinitionCacheBackend,
  DiscoveryInterface,
  PluginConstructor,
  PluginDefinition,
} from './types.js';

/** Options for {@link DefaultPluginManager}. */
export interface DefaultPluginManagerOptions {
  /** Values merged under every discovered definition (definition wins). */
  defaults?: PluginDefinition;
  /** Optional persistent cache backend for the assembled definition map. */
  cache?: DefinitionCacheBackend;
  /** Key under which definitions are stored in {@link cache}. */
  cacheKey?: string;
  /** Base constructor every plugin instance must extend. */
  pluginInterface?: PluginConstructor | null;
}

/**
 * The standard plugin manager.
 *
 * Port of `Drupal\Core\Plugin\DefaultPluginManager` (condensed). Composes a
 * {@link ManifestDiscovery} (the TS stand-in for annotation scanning), wraps it
 * in a {@link DerivativeDiscoveryDecorator} for derivative support, and serves
 * instances through a {@link DefaultFactory}. Assembled definitions are cached
 * in-memory (a static cache) and optionally persisted to a cache backend.
 */
export class DefaultPluginManager
  extends PluginManagerBase
  implements CachedDiscoveryInterface
{
  protected readonly manifestDiscovery: ManifestDiscovery;
  protected readonly derivativeDiscovery: DerivativeDiscoveryDecorator;
  protected readonly cache: DefinitionCacheBackend | null;
  protected readonly cacheKey: string;
  protected useCachesFlag = true;
  protected definitions: Record<string, PluginDefinition> | null = null;

  constructor(manifest: Manifest, options: DefaultPluginManagerOptions = {}) {
    super();
    this.manifestDiscovery = new ManifestDiscovery(manifest, options.defaults ?? {});
    this.derivativeDiscovery = new DerivativeDiscoveryDecorator(this.manifestDiscovery);
    this.discovery = this.derivativeDiscovery;
    this.factory = new DefaultFactory(
      this as unknown as DiscoveryInterface,
      options.pluginInterface ?? null,
    );
    this.cache = options.cache ?? null;
    this.cacheKey = options.cacheKey ?? this.constructor.name;
  }

  override getDefinitions(): Record<string, PluginDefinition> {
    if (this.definitions !== null) {
      return this.definitions;
    }

    if (this.useCachesFlag && this.cache) {
      const cached = this.cache.get(this.cacheKey);
      if (cached !== undefined) {
        this.definitions = cached;
        return cached;
      }
    }

    const definitions = this.derivativeDiscovery.getDefinitions();
    this.definitions = definitions;

    if (this.useCachesFlag && this.cache) {
      this.cache.set(this.cacheKey, definitions);
    }

    return definitions;
  }

  override getDefinition(pluginId: string, exceptionOnInvalid = true): PluginDefinition | null {
    return doGetDefinition(
      this.getDefinitions(),
      pluginId,
      exceptionOnInvalid,
      this.constructor.name,
    );
  }

  override hasDefinition(pluginId: string): boolean {
    return this.getDefinition(pluginId, false) !== null;
  }

  clearCachedDefinitions(): void {
    this.definitions = null;
    this.derivativeDiscovery.clearCachedDefinitions();
    if (this.cache) {
      this.cache.delete(this.cacheKey);
    }
  }

  useCaches(useCaches = true): void {
    this.useCachesFlag = useCaches;
    if (!useCaches) {
      this.definitions = null;
      this.derivativeDiscovery.clearCachedDefinitions();
    }
  }
}
