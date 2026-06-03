/**
 * Page Cache request/response policies — TypeScript port of the policy classes
 * Drupal's `dynamic_page_cache` module relies on.
 *
 * Ports:
 *  - `Drupal\Core\PageCache\RequestPolicyInterface` / `ResponsePolicyInterface`
 *  - `Drupal\Core\PageCache\ChainRequestPolicy` / `ChainResponsePolicy`
 *  - `Drupal\Core\PageCache\RequestPolicy\CommandLineOrUnsafeMethod`
 *  - `Drupal\dynamic_page_cache\PageCache\RequestPolicy\DefaultRequestPolicy`
 *  - `Drupal\dynamic_page_cache\PageCache\ResponsePolicy\DenyAdminRoutes`
 *
 * The Core base classes/interfaces live in `core/lib`; in a fully-ported tree
 * they would belong to a `@drupaljs/page-cache` package. That package does not
 * exist yet, so the Core contracts are defined here as minimal LOCAL types.
 *
 * TODO(@drupaljs/page-cache): move RequestPolicy/ResponsePolicy contracts,
 * ChainRequestPolicy/ChainResponsePolicy and CommandLineOrUnsafeMethod into a
 * shared core package and re-export them from here.
 */

// ---------------------------------------------------------------------------
// Minimal LOCAL HTTP-foundation shims.
//
// TODO(@drupaljs/http-foundation): replace PageRequest/PageResponse with the
// real Symfony-equivalent Request/Response types once that package lands.
// ---------------------------------------------------------------------------

/** Minimal incoming request shape needed by the page-cache policies. */
export interface PageRequest {
  /** HTTP method, e.g. "GET", "HEAD", "POST". */
  readonly method: string;
  /** True when the request originated from the command line (drush/CLI). */
  readonly isCli?: boolean;
}

/** Minimal response shape needed by the page-cache policies. */
export interface PageResponse {
  /** Response headers (Symfony's `$response->headers`). */
  readonly headers: Map<string, string>;
}

/** HTTP methods considered cacheable per RFC 7231 §4.2.3 (safe methods). */
const CACHEABLE_METHODS = new Set(['GET', 'HEAD']);

/** Mirrors Symfony `Request::isMethodCacheable()`. */
export function isMethodCacheable(request: PageRequest): boolean {
  return CACHEABLE_METHODS.has(request.method.toUpperCase());
}

// ---------------------------------------------------------------------------
// Request policy contracts (ports Drupal\Core\PageCache\RequestPolicyInterface).
// ---------------------------------------------------------------------------

/** Allowed verdicts for a request policy. */
export const RequestPolicy = {
  /** Allow delivery of cached pages. */
  ALLOW: 'allow',
  /** Deny delivery of cached pages. */
  DENY: 'deny',
} as const;

export type RequestPolicyResult = (typeof RequestPolicy)[keyof typeof RequestPolicy] | null;

/**
 * Ports `RequestPolicyInterface`: decides whether a cached page may be served.
 * `check()` returns ALLOW, DENY or null (no opinion).
 */
export interface RequestPolicyInterface {
  check(request: PageRequest): RequestPolicyResult;
}

// ---------------------------------------------------------------------------
// Response policy contracts (ports Drupal\Core\PageCache\ResponsePolicyInterface).
// ---------------------------------------------------------------------------

/** Allowed verdicts for a response policy. */
export const ResponsePolicy = {
  /** Deny storing this response in the cache. */
  DENY: 'deny',
} as const;

export type ResponsePolicyResult = (typeof ResponsePolicy)[keyof typeof ResponsePolicy] | null;

/**
 * Ports `ResponsePolicyInterface`: decides whether a response may be cached.
 * `check()` returns DENY or null (no opinion).
 */
export interface ResponsePolicyInterface {
  check(response: PageResponse, request: PageRequest): ResponsePolicyResult;
}

// ---------------------------------------------------------------------------
// CommandLineOrUnsafeMethod (Core RequestPolicy).
// ---------------------------------------------------------------------------

/**
 * Rejects when running from the CLI or when the HTTP method is not safe.
 *
 * Ports `Drupal\Core\PageCache\RequestPolicy\CommandLineOrUnsafeMethod`.
 */
export class CommandLineOrUnsafeMethod implements RequestPolicyInterface {
  check(request: PageRequest): RequestPolicyResult {
    if (request.isCli === true || !isMethodCacheable(request)) {
      return RequestPolicy.DENY;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// ChainRequestPolicy (Core).
// ---------------------------------------------------------------------------

/**
 * Compound request policy. Ports `Drupal\Core\PageCache\ChainRequestPolicy`.
 *
 * Result rules:
 *  1. DENY if any rule returns DENY (short-circuits).
 *  2. ALLOW if at least one rule returns ALLOW and none DENY.
 *  3. null otherwise.
 */
export class ChainRequestPolicy implements RequestPolicyInterface {
  protected readonly rules: RequestPolicyInterface[] = [];

  addPolicy(policy: RequestPolicyInterface): this {
    this.rules.push(policy);
    return this;
  }

  check(request: PageRequest): RequestPolicyResult {
    let finalResult: RequestPolicyResult = null;
    for (const rule of this.rules) {
      const result = rule.check(request);
      if (result === RequestPolicy.DENY) {
        return result;
      } else if (result === RequestPolicy.ALLOW) {
        finalResult = result;
      } else if (result !== null && result !== undefined) {
        throw new Error(
          'Return value of RequestPolicyInterface.check() must be one of RequestPolicy.ALLOW, RequestPolicy.DENY or null',
        );
      }
    }
    return finalResult;
  }
}

// ---------------------------------------------------------------------------
// ChainResponsePolicy (Core).
// ---------------------------------------------------------------------------

/**
 * Compound response policy. Ports `Drupal\Core\PageCache\ChainResponsePolicy`.
 * Returns DENY if any rule denies, else null.
 */
export class ChainResponsePolicy implements ResponsePolicyInterface {
  protected readonly rules: ResponsePolicyInterface[] = [];

  addPolicy(policy: ResponsePolicyInterface): this {
    this.rules.push(policy);
    return this;
  }

  check(response: PageResponse, request: PageRequest): ResponsePolicyResult {
    let finalResult: ResponsePolicyResult = null;
    for (const rule of this.rules) {
      const result = rule.check(response, request);
      if (result === ResponsePolicy.DENY) {
        return result;
      } else if (result !== null && result !== undefined) {
        throw new Error(
          'Return value of ResponsePolicyInterface.check() must be ResponsePolicy.DENY or null',
        );
      }
    }
    return finalResult;
  }
}

// ---------------------------------------------------------------------------
// DefaultRequestPolicy (dynamic_page_cache module).
// ---------------------------------------------------------------------------

/**
 * The default Dynamic Page Cache request policy.
 *
 * Ports `Drupal\dynamic_page_cache\PageCache\RequestPolicy\DefaultRequestPolicy`:
 * delivery is denied for CLI requests or unsafe HTTP methods. Additional
 * collected policies (Drupal's `service_collector`) can be added via
 * {@link ChainRequestPolicy.addPolicy}.
 */
export class DefaultRequestPolicy extends ChainRequestPolicy {
  constructor() {
    super();
    this.addPolicy(new CommandLineOrUnsafeMethod());
  }
}

// ---------------------------------------------------------------------------
// DenyAdminRoutes (dynamic_page_cache module).
// ---------------------------------------------------------------------------

/** A matched route's relevant surface (options bag). */
export interface RouteObject {
  readonly options?: Record<string, unknown>;
}

/**
 * Minimal current-route-match contract.
 *
 * TODO(@drupaljs/routing): replace with the shared RouteMatchInterface once the
 * routing package exposes it.
 */
export interface RouteMatchInterface {
  getRouteObject(): RouteObject | null;
}

/**
 * Denies caching responses generated for admin routes (`_admin_route` option),
 * which have low cache hit ratios.
 *
 * Ports `Drupal\dynamic_page_cache\PageCache\ResponsePolicy\DenyAdminRoutes`.
 */
export class DenyAdminRoutes implements ResponsePolicyInterface {
  constructor(private readonly routeMatch: RouteMatchInterface) {}

  check(_response: PageResponse, _request: PageRequest): ResponsePolicyResult {
    const route = this.routeMatch.getRouteObject();
    if (route && route.options?.['_admin_route']) {
      return ResponsePolicy.DENY;
    }
    return null;
  }
}
