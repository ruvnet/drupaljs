/**
 * @drupaljs/config — TypeScript port of Drupal Core's Configuration system.
 *
 * Public API: storage (interface + in-memory), the config object hierarchy
 * (ConfigBase → Config → ImmutableConfig), the ConfigFactory, the override
 * layer, and the configuration events.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config
 */

export { NestedArray } from './nested-array.js';
export type { ConfigData, GetValueResult } from './nested-array.js';

export { StorageInterface } from './storage.js';
export { MemoryStorage } from './memory-storage.js';

export { ConfigBase } from './config-base.js';
export { Config } from './config.js';
export { ImmutableConfig } from './immutable-config.js';
export { ConfigFactory } from './config-factory.js';

export type { ConfigFactoryOverrideInterface } from './overrides.js';
export type {
  TypedConfigManagerInterface,
} from './typed-config.js';
export { NullTypedConfigManager } from './typed-config.js';

export {
  ConfigEvents,
  ConfigCrudEvent,
  ConfigRenameEvent,
} from './events.js';
export type { EventDispatcherInterface } from './events.js';

export {
  Cache,
  CACHE_PERMANENT,
} from './cacheability.js';
export type {
  CacheableMetadata,
  CacheableDependencyInterface,
} from './cacheability.js';

export {
  ConfigException,
  ConfigNameException,
  ConfigValueException,
  ImmutableConfigException,
  StorageException,
} from './exceptions.js';
