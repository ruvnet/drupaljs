/**
 * TypeScript port of `Drupal\page_cache\StackMiddleware\PageCache`.
 *
 * Source: core/modules/page_cache/src/StackMiddleware/PageCache.php
 *
 * Executes page caching before the main kernel handles the request. Faithful to
 * the PHP control flow: request-policy gate, cache lookup (HIT), backend fetch
 * (MISS / UNCACHEABLE), conditional 304 revalidation, private-marking for
 * session + Vary: Cookie responses, and the cache-tag-keyed store with the
 * `Cache::PERMANENT` / `cache_ttl_4xx` / `Expires` expiry rules.
 *
 * Symfony's `Request`/`Response` and Drupal's policy interfaces are modelled by
 * the local {@link contracts} types (see TODOs there).
 */
import {
  type HttpRequest,
  type HttpResponse,
  type RequestPolicyInterface,
  type ResponsePolicyInterface,
  type RequestType,
  MAIN_REQUEST,
} from '../contracts.js';
import { CACHE_PERMANENT, type CacheBackendInterface, type CacheItem } from '../cache.js';

/** Name of Page Cache's response header (`PageCache::HEADER`), lower-cased. */
export const X_DRUPAL_CACHE = 'x-drupal-cache';

/**
 * The decorated kernel. In Drupal the constructor takes a `\Closure` returning
 * an `HttpKernelInterface` whose `handle()` is then invoked; here those two
 * steps are collapsed into a single call that returns the response for the
 * request (the request/type/catch args are bound by the wiring layer).
 * TODO(@drupaljs/http-kernel): pass through (request, type, catch) once the
 *   HttpKernelInterface port lands.
 */
export type KernelClosure = () => HttpResponse;

/**
 * Settings the middleware reads from Drupal's `Settings` / runtime that have no
 * service of their own. Injected to keep the middleware pure & testable.
 */
export interface PageCacheSettings {
  /**
   * TTL (seconds) for cached 4xx client errors (`Settings::get('cache_ttl_4xx',
   * 3600)`). `0` disables caching of client errors. Defaults to 3600.
   */
  cacheTtl4xx?: number;
  /**
   * The session cookie name (`session_name()`); used to decide whether to mark
   * a `Vary: Cookie` response private. Defaults to "SESS".
   */
  sessionName?: string;
}

/** HTTP methods that are cacheable per RFC 7231 §4.2.3 (Request::isMethodCacheable). */
const CACHEABLE_METHODS = new Set(['GET', 'HEAD']);

/** Headers that MAY remain on a 304 response (RFC 2616 §10.3.5). */
const HEADERS_ALLOWED_ON_304 = new Set(['content-location', 'expires', 'cache-control', 'vary']);

export class PageCache {
  private readonly httpKernel: KernelClosure;
  private readonly cache: CacheBackendInterface;
  private readonly requestPolicy: RequestPolicyInterface;
  private readonly responsePolicy: ResponsePolicyInterface;
  private readonly settings: Required<PageCacheSettings>;

  /** Memoised cache ID for the (master) request (`PageCache::$cid`). */
  private cid?: string;

  constructor(
    httpKernel: KernelClosure,
    cache: CacheBackendInterface,
    requestPolicy: RequestPolicyInterface,
    responsePolicy: ResponsePolicyInterface,
    settings: PageCacheSettings = {},
  ) {
    this.httpKernel = httpKernel;
    this.cache = cache;
    this.requestPolicy = requestPolicy;
    this.responsePolicy = responsePolicy;
    this.settings = {
      cacheTtl4xx: settings.cacheTtl4xx ?? 3600,
      sessionName: settings.sessionName ?? 'SESS',
    };
  }

  /** Ports `PageCache::handle()`. */
  handle(request: HttpRequest, type: RequestType = MAIN_REQUEST): HttpResponse {
    let response: HttpResponse;
    if (type === MAIN_REQUEST && this.requestPolicy.check(request) === 'allow') {
      response = this.lookup(request);
    } else {
      response = this.pass();
      // Don't indicate non-cacheability on responses to uncacheable requests.
      if (this.isMethodCacheable(request)) {
        response.headers[X_DRUPAL_CACHE] = 'UNCACHEABLE (request policy)';
      }
    }
    return response;
  }

  /** Ports `PageCache::pass()`. */
  private pass(): HttpResponse {
    return this.httpKernel();
  }

  /** Ports `PageCache::lookup()`. */
  private lookup(request: HttpRequest): HttpResponse {
    let response = this.get(request);
    if (response) {
      response.headers[X_DRUPAL_CACHE] = 'HIT';
    } else {
      response = this.fetch(request);
    }

    // Only allow browser caching (not external proxies) when: there is a session
    // cookie, the response varies by Cookie, and Cache-Control lacks no-cache.
    if (
      request.cookies?.[this.settings.sessionName] !== undefined &&
      response.vary.includes('Cookie') &&
      !response.cacheControl['no-cache']
    ) {
      response.setPrivate();
    }

    // HTTP revalidation -> 304 when conditional headers match.
    const lastModified = response.lastModified;
    if (lastModified) {
      const ifModifiedSince = this.serverNumber(request, 'HTTP_IF_MODIFIED_SINCE');
      const ifNoneMatch = this.serverString(request, 'HTTP_IF_NONE_MATCH');
      if (
        ifModifiedSince !== false &&
        ifNoneMatch !== false &&
        ifNoneMatch === response.etag &&
        ifModifiedSince === lastModified
      ) {
        response.statusCode = 304;
        response.content = null;
        for (const name of Object.keys(response.headers)) {
          if (!HEADERS_ALLOWED_ON_304.has(name)) {
            delete response.headers[name];
          }
        }
      }
    }

    return response;
  }

  /** Ports `PageCache::fetch()`. */
  private fetch(request: HttpRequest): HttpResponse {
    const response = this.httpKernel();
    if (this.storeResponse(request, response)) {
      response.headers[X_DRUPAL_CACHE] = 'MISS';
    }
    return response;
  }

  /** Ports `PageCache::storeResponse()`. */
  private storeResponse(request: HttpRequest, response: HttpResponse): boolean {
    // Only cache responses that carry cacheable metadata (the TS equivalent of
    // CacheableResponseInterface).
    if (response.cacheableMetadata === undefined) {
      response.headers[X_DRUPAL_CACHE] = 'UNCACHEABLE (no cacheability)';
      return false;
    }

    // BinaryFileResponse / StreamedResponse can't be cached. The local model has
    // no such subclasses yet; left as a documented no-op.
    // TODO(@drupaljs/http-foundation): exclude binary/streamed responses once modelled.

    if (this.responsePolicy.check(response, request) === 'deny') {
      response.headers[X_DRUPAL_CACHE] = 'UNCACHEABLE (response policy)';
      return false;
    }

    const requestTime = this.serverNumber(request, 'REQUEST_TIME') || 0;
    let expire: number = CACHE_PERMANENT;

    if (this.isClientError(response)) {
      // 4xx: cache for cache_ttl_4xx seconds (0 disables).
      const ttl = this.settings.cacheTtl4xx;
      expire = ttl > 0 ? requestTime + ttl : 0;
    } else if (response.expires != null) {
      expire = response.expires > requestTime ? response.expires : CACHE_PERMANENT;
    } else {
      expire = CACHE_PERMANENT;
    }

    if (expire === CACHE_PERMANENT || expire > requestTime) {
      const tags = response.cacheableMetadata.getCacheTags();
      this.set(request, response, expire, tags);
    }

    return true;
  }

  /** Ports `PageCache::get()`. */
  private get(request: HttpRequest, allowInvalid = false): HttpResponse | false {
    const cid = this.getCacheId(request);
    const cache = this.cache.get(cid, allowInvalid) as CacheItem<HttpResponse> | false;
    if (cache) {
      return cache.data;
    }
    return false;
  }

  /** Ports `PageCache::set()`. */
  private set(request: HttpRequest, response: HttpResponse, expire: number, tags: string[]): void {
    const cid = this.getCacheId(request);
    this.cache.set(cid, response, expire, tags);
  }

  /** Ports `PageCache::getCacheId()`. Memoised for the request's lifetime. */
  private getCacheId(request: HttpRequest): string {
    if (this.cid === undefined) {
      const cidParts = [
        request.schemeAndHttpHost + request.requestUri,
        request.requestFormat ?? '',
      ];
      this.cid = cidParts.join(':');
    }
    return this.cid;
  }

  // -- Request/response helpers (model Symfony surface) --------------------

  private isMethodCacheable(request: HttpRequest): boolean {
    return CACHEABLE_METHODS.has(request.method.toUpperCase());
  }

  private isClientError(response: HttpResponse): boolean {
    return response.statusCode >= 400 && response.statusCode < 500;
  }

  private serverNumber(request: HttpRequest, key: string): number | false {
    const value = request.server?.[key];
    if (value === undefined) return false;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(n) ? false : n;
  }

  private serverString(request: HttpRequest, key: string): string | false {
    const value = request.server?.[key];
    return value === undefined ? false : String(value);
  }
}
