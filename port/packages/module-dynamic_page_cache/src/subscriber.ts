/**
 * DynamicPageCacheSubscriber — TypeScript port of
 * `Drupal\dynamic_page_cache\EventSubscriber\DynamicPageCacheSubscriber`.
 *
 * Dynamic Page Cache serves cached responses as early as possible. It is
 * implemented as two kernel event subscribers:
 *  - a late REQUEST subscriber (priority 27) that serves cache HITs, and
 *  - an early RESPONSE subscriber (priority 7) that stores cacheable MISSes.
 *
 * It works only with *cacheable* responses (those carrying cacheability
 * metadata), because it must inspect and combine cache contexts/tags/max-age.
 *
 * @see core/modules/dynamic_page_cache/src/EventSubscriber/DynamicPageCacheSubscriber.php
 */
import {
  RequestPolicy,
  ResponsePolicy,
  isMethodCacheable,
  type PageRequest,
  type PageResponse,
  type RequestPolicyInterface,
  type ResponsePolicyInterface,
  type RequestPolicyResult,
} from './page-cache-policy.js';

/** Cache lifetime sentinel: cache permanently. Mirrors `Cache::PERMANENT` (-1). */
export const CACHE_PERMANENT = -1;

/** Name of Dynamic Page Cache's response header (`X-Drupal-Dynamic-Cache`). */
export const DYNAMIC_CACHE_HEADER = 'X-Drupal-Dynamic-Cache';

/**
 * Cacheability metadata attached to a response.
 *
 * Ports the relevant surface of `Drupal\Core\Cache\CacheableMetadata`.
 *
 * TODO(@drupaljs/cache): replace with the shared CacheableMetadata type once
 * the cache package exposes it.
 */
export interface CacheableMetadata {
  /** Max-age in seconds, or {@link CACHE_PERMANENT}. */
  maxAge: number;
  /** Cache contexts the item varies by (e.g. 'route', 'user'). */
  contexts: string[];
  /** Cache tags for invalidation. */
  tags: string[];
}

/** A response carrying cacheability metadata (`CacheableResponseInterface`). */
export interface CacheableResponse extends PageResponse {
  statusCode: number;
  cacheableMetadata: CacheableMetadata;
}

/**
 * Variation cache contract.
 *
 * Ports `Drupal\Core\Cache\VariationCacheInterface` (minimal surface): items
 * are keyed by a cache-key list and varied by the supplied cacheability.
 *
 * TODO(@drupaljs/cache): replace with the shared VariationCacheInterface.
 */
export interface VariationCacheInterface {
  get(
    keys: string[],
    initialMetadata: Partial<CacheableMetadata>,
  ): { data: CacheableResponse } | null;
  set(
    keys: string[],
    data: CacheableResponse,
    metadata: CacheableMetadata,
    initialMetadata: Partial<CacheableMetadata>,
  ): void;
}

/**
 * Cache contexts manager contract.
 *
 * Ports the slice of `Drupal\Core\Cache\Context\CacheContextsManager` the
 * subscriber uses to mimic variation-cache context handling.
 *
 * TODO(@drupaljs/cache): replace with the shared CacheContextsManager.
 */
export interface CacheContextsManagerInterface {
  /** Removes contexts that are implied by others (`optimizeTokens`). */
  optimizeTokens(contexts: string[]): string[];
  /** Converts context tokens to concrete cache keys + tags. */
  convertTokensToKeys(contexts: string[]): { tags: string[] };
}

/** Renderer config: the auto-placeholdering conditions (`renderer.config`). */
export interface RendererConfig {
  auto_placeholder_conditions: {
    'max-age': number;
    contexts: string[];
    tags: string[];
  };
}

/** A kernel REQUEST event (`Symfony\...\Event\RequestEvent`). */
export interface RequestEvent {
  readonly request: PageRequest;
  response?: CacheableResponse;
}

/**
 * A kernel RESPONSE event (`Symfony\...\Event\ResponseEvent`).
 *
 * The response is a plain {@link PageResponse}; it carries a `statusCode` (every
 * Symfony Response does) but may or may not be a {@link CacheableResponse}.
 * Dynamic Page Cache narrows it at runtime via the cacheability check.
 */
export interface ResponseEvent {
  readonly request: PageRequest;
  readonly response: PageResponse & { statusCode: number };
}

/** Subscribed-events descriptor (TS analogue of `getSubscribedEvents()`). */
export interface SubscribedEvents {
  request: { method: string; priority: number }[];
  response: { method: string; priority: number }[];
}

/** Default cache contexts every Dynamic Page Cache item varies by. */
const DEFAULT_CACHE_CONTEXTS: readonly string[] = ['route', 'request_format'];

/**
 * Returns cached responses as early as possible, caching cacheable misses.
 */
export class DynamicPageCacheSubscriber {
  /** Internal cache of request-policy results, keyed by request object. */
  private readonly requestPolicyResults = new WeakMap<object, RequestPolicyResult>();

  constructor(
    private readonly requestPolicy: RequestPolicyInterface,
    private readonly responsePolicy: ResponsePolicyInterface,
    private readonly cache: VariationCacheInterface,
    private readonly cacheContextsManager: CacheContextsManagerInterface,
    private readonly rendererConfig: RendererConfig,
  ) {}

  /** Sets a response in case of a Dynamic Page Cache hit. */
  onRequest(event: RequestEvent): void {
    const request = event.request;
    const result = this.requestPolicy.check(request);
    this.requestPolicyResults.set(request, result);
    if (result === RequestPolicy.DENY) {
      return;
    }

    const cached = this.cache.get(['response'], { contexts: [...DEFAULT_CACHE_CONTEXTS] });
    if (cached) {
      const response = cached.data;
      response.headers.set(DYNAMIC_CACHE_HEADER, 'HIT');
      event.response = response;
    }
  }

  /** Stores a response in case of a Dynamic Page Cache miss, if cacheable. */
  onResponse(event: ResponseEvent): void {
    const response = event.response;
    const request = event.request;

    // Don't indicate non-cacheability on responses to uncacheable requests.
    if (!isMethodCacheable(request)) {
      return;
    }

    // The request subscriber did not fire -> a hit was impossible.
    if (!this.requestPolicyResults.has(request)) {
      const subStatus = response.headers.has(DYNAMIC_CACHE_HEADER)
        ? `, sub-request: ${response.headers.get(DYNAMIC_CACHE_HEADER)}`
        : '';
      response.headers.set(
        DYNAMIC_CACHE_HEADER,
        `UNCACHEABLE (${response.statusCode}${subStatus})`,
      );
      return;
    }

    // Dynamic Page Cache only works with cacheable responses.
    if (!isCacheableResponse(response)) {
      response.headers.set(DYNAMIC_CACHE_HEADER, 'UNCACHEABLE (no cacheability)');
      return;
    }

    // Nothing left to do for a hit.
    if (response.headers.get(DYNAMIC_CACHE_HEADER) === 'HIT') {
      return;
    }

    // Nothing left to do for an uncacheable response.
    if (!this.shouldCacheResponse(response)) {
      response.headers.set(DYNAMIC_CACHE_HEADER, 'UNCACHEABLE (poor cacheability)');
      return;
    }

    if (this.requestPolicyResults.get(request) === RequestPolicy.DENY) {
      response.headers.set(DYNAMIC_CACHE_HEADER, 'UNCACHEABLE (request policy)');
      return;
    }
    if (this.responsePolicy.check(response, request) === ResponsePolicy.DENY) {
      response.headers.set(DYNAMIC_CACHE_HEADER, 'UNCACHEABLE (response policy)');
      return;
    }

    const metadata: CacheableMetadata = {
      maxAge: response.cacheableMetadata.maxAge,
      contexts: [
        ...new Set([...response.cacheableMetadata.contexts, ...DEFAULT_CACHE_CONTEXTS]),
      ],
      tags: [...response.cacheableMetadata.tags],
    };
    this.cache.set(['response'], response, metadata, { contexts: [...DEFAULT_CACHE_CONTEXTS] });

    response.headers.set(DYNAMIC_CACHE_HEADER, 'MISS');
  }

  /**
   * Whether the given response should be cached by Dynamic Page Cache.
   *
   * Mirrors the auto-placeholdering conditions: a response is uncacheable if
   * its max-age is at/below the threshold, it has a high-cardinality context,
   * or it has a high-invalidation-frequency tag.
   */
  private shouldCacheResponse(response: CacheableResponse): boolean {
    const conditions = this.rendererConfig.auto_placeholder_conditions;
    const meta = response.cacheableMetadata;

    if (meta.maxAge !== CACHE_PERMANENT && meta.maxAge <= conditions['max-age']) {
      return false;
    }

    const optimized = this.cacheContextsManager.optimizeTokens(meta.contexts);
    if (optimized.some((c) => conditions.contexts.includes(c))) {
      return false;
    }

    if (meta.tags.some((t) => conditions.tags.includes(t))) {
      return false;
    }

    return true;
  }

  /** TS analogue of `getSubscribedEvents()`. */
  static getSubscribedEvents(): SubscribedEvents {
    return {
      request: [{ method: 'onRequest', priority: 27 }],
      response: [{ method: 'onResponse', priority: 7 }],
    };
  }
}

function isCacheableResponse(response: PageResponse): response is CacheableResponse {
  const candidate = response as Partial<CacheableResponse>;
  return (
    candidate.cacheableMetadata !== undefined &&
    typeof candidate.cacheableMetadata.maxAge === 'number'
  );
}
