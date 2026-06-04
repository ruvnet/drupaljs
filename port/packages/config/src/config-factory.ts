/**
 * Port of Drupal\Core\Config\ConfigFactory.
 *
 * Instantiates and caches Config / ImmutableConfig objects, applies the override
 * layers, and keeps its static cache consistent by reacting to SAVE/DELETE
 * events (Drupal registers this via EventSubscriberInterface). Here the factory
 * self-subscribes to the injected dispatcher so it works with any dispatcher
 * that exposes `addListener`, falling back to wrapping `dispatch` for the
 * minimal contract used in tests.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigFactory.php
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigFactoryInterface.php
 */

import { Config } from './config.js';
import { ImmutableConfig } from './immutable-config.js';
import { NestedArray, type ConfigData } from './nested-array.js';
import { Cache } from './cacheability.js';
import { StorageInterface } from './storage.js';
import {
  ConfigCrudEvent,
  ConfigEvents,
  ConfigRenameEvent,
  type EventDispatcherInterface,
} from './events.js';
import {
  NullTypedConfigManager,
  type TypedConfigManagerInterface,
} from './typed-config.js';
import type { ConfigFactoryOverrideInterface } from './overrides.js';

/** Optional richer dispatcher contract: supports named listeners. */
interface ListenableDispatcher extends EventDispatcherInterface {
  addListener(eventName: string, listener: (event: unknown) => void): void;
}

function isListenable(d: EventDispatcherInterface): d is ListenableDispatcher {
  return typeof (d as Partial<ListenableDispatcher>).addListener === 'function';
}

export class ConfigFactory {
  private cache = new Map<string, Config>();
  private readonly overrides: ConfigFactoryOverrideInterface[] = [];

  /**
   * The dispatcher handed to the Config objects this factory creates.
   *
   * When the injected dispatcher supports `addListener`, the factory subscribes
   * directly and uses it unchanged. Otherwise the factory hands its Config
   * objects a thin wrapper that forwards to the injected dispatcher (so user
   * spies still see every dispatch) and additionally runs the factory's own
   * cache-coherence handlers — without ever mutating the injected dispatcher.
   */
  private readonly configDispatcher: EventDispatcherInterface;

  constructor(
    private readonly storage: StorageInterface,
    private readonly eventDispatcher: EventDispatcherInterface,
    private readonly typedConfigManager: TypedConfigManagerInterface = new NullTypedConfigManager(),
  ) {
    this.configDispatcher = this.subscribe();
  }

  /**
   * Wires up SAVE/DELETE observation and returns the dispatcher that Config
   * objects created by this factory should use.
   */
  private subscribe(): EventDispatcherInterface {
    if (isListenable(this.eventDispatcher)) {
      this.eventDispatcher.addListener(ConfigEvents.SAVE, (e) =>
        this.onConfigSave(e as ConfigCrudEvent),
      );
      this.eventDispatcher.addListener(ConfigEvents.DELETE, (e) =>
        this.onConfigDelete(e as ConfigCrudEvent),
      );
      return this.eventDispatcher;
    }
    // Minimal dispatcher: return a forwarding wrapper, leaving the injected
    // dispatcher (and any test spy on it) untouched.
    const inner = this.eventDispatcher;
    return {
      dispatch: <T extends object>(event: T, eventName?: string): T => {
        const result = inner.dispatch(event, eventName);
        if (event instanceof ConfigCrudEvent) {
          if (eventName === ConfigEvents.SAVE) {
            this.onConfigSave(event);
          } else if (eventName === ConfigEvents.DELETE) {
            this.onConfigDelete(event);
          }
        }
        return result;
      },
    };
  }

  /** Returns an immutable, override-aware configuration object. */
  get(name: string): ImmutableConfig {
    return this.doGet(name, true) as ImmutableConfig;
  }

  /** Returns a mutable configuration object (overrides not applied). */
  getEditable(name: string): Config {
    return this.doGet(name, false);
  }

  private doGet(name: string, immutable: boolean): Config {
    const loaded = this.doLoadMultiple([name], immutable);
    const existing = loaded[name];
    if (existing) {
      return existing;
    }
    // Not in storage: return a fresh (new) object.
    const config = this.createConfigObject(name, immutable);
    if (immutable) {
      const overrides = this.loadOverrides([name]);
      if (overrides[name]) {
        config.setModuleOverride(overrides[name]!);
      }
    }
    for (const override of this.overrides) {
      config.addCacheableDependency(this.toDependency(override.getCacheableMetadata(name)));
    }
    return config;
  }

  /** Loads multiple immutable configuration objects, keyed by name. */
  loadMultiple(names: string[]): Record<string, ImmutableConfig> {
    return this.doLoadMultiple(names, true) as Record<string, ImmutableConfig>;
  }

  private doLoadMultiple(names: string[], immutable: boolean): Record<string, Config> {
    const list: Record<string, Config> = {};
    const remaining: string[] = [];

    for (const name of names) {
      const cacheKey = this.getConfigCacheKey(name, immutable);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        list[name] = cached;
      } else {
        remaining.push(name);
      }
    }

    if (remaining.length > 0) {
      const storageData = this.storage.readMultiple(remaining);
      let moduleOverrides: Record<string, ConfigData> = {};
      if (immutable && Object.keys(storageData).length > 0) {
        moduleOverrides = this.loadOverrides(remaining);
      }
      for (const [name, data] of Object.entries(storageData)) {
        const cacheKey = this.getConfigCacheKey(name, immutable);
        const config = this.createConfigObject(name, immutable);
        config.initWithData(data);
        if (immutable && moduleOverrides[name]) {
          config.setModuleOverride(moduleOverrides[name]!);
        }
        this.propagateConfigOverrideCacheability(config, name);
        this.cache.set(cacheKey, config);
        list[name] = config;
      }
    }

    return list;
  }

  private loadOverrides(names: string[]): Record<string, ConfigData> {
    let overrides: Record<string, ConfigData> = {};
    for (const override of this.overrides) {
      // Existing overrides win (higher-priority overrides added first).
      overrides = NestedArray.mergeDeepArray(
        [override.loadOverrides(names), overrides],
        true,
      ) as Record<string, ConfigData>;
    }
    return overrides;
  }

  private propagateConfigOverrideCacheability(config: Config, name: string): void {
    for (const override of this.overrides) {
      config.addCacheableDependency(this.toDependency(override.getCacheableMetadata(name)));
    }
  }

  /** Clears the static cache for one name, or everything when omitted. */
  reset(name?: string): this {
    if (name) {
      for (const key of this.getConfigCacheKeys(name)) {
        this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
    return this;
  }

  /** Clears the entire static cache. */
  clearStaticCache(): this {
    this.cache.clear();
    return this;
  }

  /** Renames a configuration object and fires a RENAME event. */
  rename(oldName: string, newName: string): this {
    Cache.invalidateTags(this.get(oldName).getCacheTags());
    this.storage.rename(oldName, newName);
    for (const key of this.getConfigCacheKeys(oldName)) {
      this.cache.delete(key);
    }
    const config = this.get(newName);
    this.eventDispatcher.dispatch(new ConfigRenameEvent(config, oldName), ConfigEvents.RENAME);
    return this;
  }

  /** Lists configuration object names by prefix, via the storage. */
  listAll(prefix = ''): string[] {
    return this.storage.listAll(prefix);
  }

  /** Registers a configuration override. */
  addOverride(override: ConfigFactoryOverrideInterface): this {
    this.overrides.push(override);
    return this;
  }

  /** The cache-key suffixes contributed by global + override layers. */
  getCacheKeys(): string[] {
    const keys = ['global_overrides'];
    for (const override of this.overrides) {
      keys.push(override.getCacheSuffix());
    }
    return keys;
  }

  private getConfigCacheKey(name: string, immutable: boolean): string {
    return immutable ? `${name}:${this.getCacheKeys().join(':')}` : name;
  }

  private getConfigCacheKeys(name: string): string[] {
    return [...this.cache.keys()].filter(
      (key) => key === name || key.startsWith(`${name}:`),
    );
  }

  /** Refreshes cached copies (other than the saved one) when config is saved. */
  onConfigSave(event: ConfigCrudEvent): void {
    const saved = event.getConfig() as Config;
    if (saved.getStorage().getCollectionName() !== this.storage.getCollectionName()) {
      return;
    }
    for (const key of this.getConfigCacheKeys(saved.getName())) {
      const cached = this.cache.get(key);
      if (cached && cached !== saved) {
        cached.initWithData(saved.getRawData());
      }
    }
  }

  /** Drops cached copies when config is deleted. */
  onConfigDelete(event: ConfigCrudEvent): void {
    const deleted = event.getConfig() as Config;
    if (deleted.getStorage().getCollectionName() !== this.storage.getCollectionName()) {
      return;
    }
    for (const key of this.getConfigCacheKeys(deleted.getName())) {
      this.cache.delete(key);
    }
  }

  private createConfigObject(name: string, immutable: boolean): Config {
    return immutable
      ? new ImmutableConfig(name, this.storage, this.configDispatcher, this.typedConfigManager)
      : new Config(name, this.storage, this.configDispatcher, this.typedConfigManager);
  }

  private toDependency(metadata: {
    cacheTags: string[];
    cacheContexts: string[];
    cacheMaxAge: number;
  }) {
    return {
      getCacheTags: () => metadata.cacheTags,
      getCacheContexts: () => metadata.cacheContexts,
      getCacheMaxAge: () => metadata.cacheMaxAge,
    };
  }
}
