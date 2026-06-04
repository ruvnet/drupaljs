/**
 * @drupaljs/module-page_cache — TypeScript port of Drupal core's
 * **Internal Page Cache** module (core/modules/page_cache).
 *
 * Caches whole pages for anonymous users. The heart of the module is the
 * {@link PageCache} HTTP stack middleware, which runs before the main kernel:
 * it looks responses up by URL+format, serves HITs, stores cacheable responses
 * keyed by cache tags, performs 304 revalidation, and respects request/response
 * caching policies.
 *
 * This is a faithful but minimal vertical slice. Symfony's HttpFoundation
 * (`Request`/`Response`) and Drupal's PageCache policy interfaces are modelled
 * by local {@link HttpRequest}/{@link HttpResponse}/policy contracts (see the
 * TODOs in `contracts.ts`); the cache backend, `Cache::PERMANENT`, and
 * `CacheableMetadata` come from `@drupaljs/cache`.
 */

// Middleware (the module's core).
export {
  PageCache,
  X_DRUPAL_CACHE,
  type KernelClosure,
  type PageCacheSettings,
} from './stack-middleware/page-cache.js';

// Hook implementations (registered via @drupaljs/hook).
export { pageCacheHelp, registerPageCacheHooks } from './hooks.js';

// Module metadata (info / permissions / routes / service descriptors).
export {
  pageCacheInfo,
  pageCachePermissions,
  pageCacheRoutes,
  pageCacheServices,
  type ModuleInfo,
  type ServiceDefinition,
  type ServiceTag,
} from './module.js';

// Contracts (HTTP + policy seams).
export {
  type HttpRequest,
  type HttpResponse,
  type RequestPolicyInterface,
  type ResponsePolicyInterface,
  type RequestPolicyResult,
  type ResponsePolicyResult,
  type RequestType,
  REQUEST_POLICY_ALLOW,
  RESPONSE_POLICY_DENY,
  MAIN_REQUEST,
  SUB_REQUEST,
} from './contracts.js';

// Cache seam re-exports (convenience for consumers wiring the middleware).
export {
  CACHE_PERMANENT,
  type CacheBackendInterface,
  type CacheItem,
  CacheableMetadata,
} from './cache.js';
