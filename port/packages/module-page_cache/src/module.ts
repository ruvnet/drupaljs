/**
 * page_cache module metadata: info, permissions, routes, and service
 * descriptors — TypeScript-native ports of the module's YAML files.
 *
 * Sources:
 * - core/modules/page_cache/page_cache.info.yml
 * - core/modules/page_cache/page_cache.services.yml
 *
 * page_cache defines no permissions and no routes in Drupal core, so those are
 * empty maps (asserted by tests, kept for a uniform module surface).
 */

/** Parsed `page_cache.info.yml`. */
export interface ModuleInfo {
  name: string;
  type: string;
  description?: string;
  package?: string;
  [key: string]: unknown;
}

/** Mirrors page_cache.info.yml. */
export const pageCacheInfo: ModuleInfo = {
  name: 'Internal Page Cache',
  type: 'module',
  description: 'Caches pages for anonymous users.',
  package: 'Core',
};

/**
 * Permission map (machine name -> definition). page_cache declares none.
 * TODO(@drupaljs/user): adopt the shared Permission type once user lands.
 */
export const pageCachePermissions: Record<string, unknown> = {};

/**
 * Route map (route name -> definition). page_cache declares none.
 * TODO(@drupaljs/routing): adopt the shared Route type once routing lands.
 */
export const pageCacheRoutes: Record<string, unknown> = {};

/** A service tag, e.g. `{ name: 'http_middleware', priority: 200 }`. */
export interface ServiceTag {
  name: string;
  priority?: number;
  [key: string]: unknown;
}

/** A container service descriptor, faithful to a `services.yml` entry. */
export interface ServiceDefinition {
  class: string;
  arguments?: string[];
  tags?: ServiceTag[];
  factory?: [string, string];
}

/**
 * Mirrors page_cache.services.yml. These are *descriptors* — the actual wiring
 * happens in the dependency-injection container.
 * TODO(@drupaljs/di): register these against the real container builder.
 */
export const pageCacheServices: Record<string, ServiceDefinition> = {
  'http_middleware.page_cache': {
    class: 'PageCache',
    arguments: ['@cache.page', '@page_cache_request_policy', '@page_cache_response_policy'],
    tags: [{ name: 'http_middleware', priority: 200 }],
  },
  'cache.page': {
    class: 'CacheBackendInterface',
    tags: [{ name: 'cache.bin' }],
    factory: ['@cache_factory', 'get'],
    arguments: ['page'],
  },
};
