/**
 * @drupaljs/plugin — TypeScript port of Drupal's Plugin API.
 *
 * Ports `Drupal\Component\Plugin` + the core `DefaultPluginManager`:
 * discovery (registration-based + manifest-driven, replacing PHP annotations),
 * a constructor-based factory, plugin/manager base classes, derivative support,
 * and a definition cache.
 *
 * @see ADR-0014 (monorepo), ADR-0016 (TDD/Vitest), ADR-0017 (package ownership)
 */

// Contracts
export type {
  PluginDefinition,
  PluginConstructor,
  DeriverConstructor,
  DiscoveryInterface,
  FactoryInterface,
  MapperInterface,
  PluginManagerInterface,
  CachedDiscoveryInterface,
  FallbackPluginManagerInterface,
  PluginInspectionInterface,
  DerivativeInspectionInterface,
  DeriverInterface,
  DefinitionCacheBackend,
} from './types.js';

// Exceptions
export {
  PluginException,
  PluginNotFoundException,
  InvalidPluginDefinitionException,
  InvalidDeriverException,
} from './exception.js';

// Discovery
export { StaticDiscovery } from './discovery/static-discovery.js';
export { ManifestDiscovery, type Manifest } from './discovery/manifest-discovery.js';
export { DerivativeDiscoveryDecorator } from './discovery/derivative-discovery-decorator.js';
export { doGetDefinition } from './discovery/discovery-trait.js';

// Factory
export { DefaultFactory } from './factory/default-factory.js';

// Base classes
export { PluginBase } from './plugin-base.js';
export { DeriverBase } from './deriver-base.js';
export { PluginManagerBase } from './plugin-manager-base.js';

// Manager
export {
  DefaultPluginManager,
  type DefaultPluginManagerOptions,
} from './default-plugin-manager.js';
