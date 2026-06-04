/**
 * Local contracts for the page_cache vertical slice.
 *
 * Drupal's `PageCache` middleware depends on Symfony's HttpFoundation
 * (`Request`, `Response`) and Drupal's PageCache policy interfaces
 * (`Drupal\Core\PageCache\RequestPolicyInterface`,
 * `Drupal\Core\PageCache\ResponsePolicyInterface`). None of those subsystems are
 * ported yet, so this file defines the *minimal* surface the middleware actually
 * touches — faithful to the PHP method/constant names — as local types.
 *
 * TODO(@drupaljs/http-foundation): replace `HttpRequest`/`HttpResponse` with the
 *   real ported Request/Response once an HttpFoundation port lands.
 * TODO(@drupaljs/page-cache-policy): promote `RequestPolicyInterface` /
 *   `ResponsePolicyInterface` into a shared core PageCache package when the
 *   policy chain (`ChainRequestPolicy`, `NoSessionOpen`, etc.) is ported.
 */

import type { CacheableMetadata } from './cache.js';

/**
 * Minimal port of `Symfony\Component\HttpFoundation\Request`.
 *
 * Only the members `PageCache` reads are modelled: the method, the scheme/host
 * and URI used to build the cache ID, the request format, the session cookie,
 * the conditional-request server vars and `REQUEST_TIME`.
 */
export interface HttpRequest {
  /** HTTP method, uppercase (e.g. "GET", "POST"). */
  readonly method: string;
  /** Scheme + host, e.g. "https://example.com" (Request::getSchemeAndHttpHost). */
  readonly schemeAndHttpHost: string;
  /** Request URI incl. query string, e.g. "/node/1?x=1" (Request::getRequestUri). */
  readonly requestUri: string;
  /**
   * Negotiated request format (Request::getRequestFormat), e.g. "html"/"json".
   * May be null before routing — the cache ID keys on that null faithfully.
   */
  readonly requestFormat?: string | null;
  /** Request cookies keyed by name (Request->cookies). */
  readonly cookies?: Readonly<Record<string, string>>;
  /**
   * Server vars (Request->server): used for conditional requests
   * (`HTTP_IF_MODIFIED_SINCE`, `HTTP_IF_NONE_MATCH`) and `REQUEST_TIME`.
   */
  readonly server?: Readonly<Record<string, string | number>>;
}

/**
 * Minimal port of `Symfony\Component\HttpFoundation\Response`, plus the
 * `Drupal\Core\Cache\CacheableResponseInterface` marker via
 * {@link cacheableMetadata}.
 *
 * Headers are modelled as a flat, lower-cased map; `vary` and the cache-control
 * directives the middleware inspects are first-class for clarity.
 */
export interface HttpResponse {
  /** HTTP status code. */
  statusCode: number;
  /** Response body; `null` once stripped for a 304. */
  content: string | null;
  /** Response headers, keys lower-cased (`X-Drupal-Cache` -> "x-drupal-cache"). */
  readonly headers: Record<string, string>;
  /** Values of the `Vary` header (Response::getVary), e.g. ["Cookie"]. */
  vary: string[];
  /**
   * Cache-Control directives present on the response (e.g. `{ 'no-cache': true,
   * 'public': true }`). Mirrors `headers->hasCacheControlDirective()`.
   */
  cacheControl: Record<string, boolean>;
  /** `Last-Modified` as a Unix timestamp (seconds), or null (Response::getLastModified). */
  lastModified?: number | null;
  /** `ETag` value (Response::getEtag), or null. */
  etag?: string | null;
  /** `Expires` as a Unix timestamp (seconds), or null (Response::getExpires). */
  expires?: number | null;
  /**
   * The response's cacheable metadata when it implements
   * `CacheableResponseInterface`; absent/undefined for plain responses (which
   * page_cache treats as UNCACHEABLE).
   */
  readonly cacheableMetadata?: CacheableMetadata;
  /** Marks the response private (Response::setPrivate). */
  setPrivate(): void;
}

/** Result of `RequestPolicyInterface::check()`. */
export type RequestPolicyResult = 'allow' | null;

/**
 * Port of `Drupal\Core\PageCache\RequestPolicyInterface`.
 *
 * Returns {@link RequestPolicyInterface.ALLOW} to permit page caching for the
 * request, or `null` (no opinion / deny) otherwise.
 */
export interface RequestPolicyInterface {
  check(request: HttpRequest): RequestPolicyResult;
}

/** Result of `ResponsePolicyInterface::check()`. */
export type ResponsePolicyResult = 'deny' | null;

/**
 * Port of `Drupal\Core\PageCache\ResponsePolicyInterface`.
 *
 * Returns {@link ResponsePolicyInterface.DENY} to forbid caching the response,
 * or `null` to express no opinion.
 */
export interface ResponsePolicyInterface {
  check(response: HttpResponse, request: HttpRequest): ResponsePolicyResult;
}

/** `RequestPolicyInterface::ALLOW`. */
export const REQUEST_POLICY_ALLOW: RequestPolicyResult = 'allow';
/** `ResponsePolicyInterface::DENY`. */
export const RESPONSE_POLICY_DENY: ResponsePolicyResult = 'deny';

/** Request kind, mirrors `HttpKernelInterface::MAIN_REQUEST` / `SUB_REQUEST`. */
export type RequestType = 'main' | 'sub';
export const MAIN_REQUEST: RequestType = 'main';
export const SUB_REQUEST: RequestType = 'sub';
