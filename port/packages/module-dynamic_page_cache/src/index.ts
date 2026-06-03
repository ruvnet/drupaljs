/**
 * @drupaljs/module-dynamic_page_cache — TypeScript port of Drupal core's
 * `dynamic_page_cache` module.
 *
 * Internal Dynamic Page Cache caches rendered pages for all users, using cache
 * contexts/tags/max-age to handle dynamic content correctly. This vertical
 * slice ports its core surface:
 *
 *  - Page cache request/response policies + the chain machinery they extend
 *    ({@link ./page-cache-policy}).
 *  - The two-phase kernel event subscriber that serves hits and stores misses
 *    ({@link ./subscriber}).
 *  - `hook_help` registered via `@drupaljs/hook` ({@link ./hooks}).
 *
 * Deep Core collaborators (CacheableMetadata, VariationCache, the contexts
 * manager, HTTP-foundation Request/Response, routing) are stubbed here as
 * minimal LOCAL types carrying `TODO(@drupaljs/...)` markers, to be replaced by
 * shared packages as the port progresses.
 *
 * @see core/modules/dynamic_page_cache
 */

export {
  // Contracts + verdict enums.
  RequestPolicy,
  ResponsePolicy,
  isMethodCacheable,
  // Chain machinery (Core).
  ChainRequestPolicy,
  ChainResponsePolicy,
  // Core + module policies.
  CommandLineOrUnsafeMethod,
  DefaultRequestPolicy,
  DenyAdminRoutes,
} from './page-cache-policy.js';

export type {
  PageRequest,
  PageResponse,
  RequestPolicyInterface,
  RequestPolicyResult,
  ResponsePolicyInterface,
  ResponsePolicyResult,
  RouteObject,
  RouteMatchInterface,
} from './page-cache-policy.js';

export {
  DynamicPageCacheSubscriber,
  DYNAMIC_CACHE_HEADER,
  CACHE_PERMANENT,
} from './subscriber.js';

export type {
  CacheableMetadata,
  CacheableResponse,
  VariationCacheInterface,
  CacheContextsManagerInterface,
  RendererConfig,
  RequestEvent,
  ResponseEvent,
  SubscribedEvents,
} from './subscriber.js';

export { dynamicPageCacheHelp, registerDynamicPageCacheHooks } from './hooks.js';
