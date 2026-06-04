/**
 * RouteProviderInterface + an in-memory implementation.
 *
 * Port of Drupal `Core\Routing\RouteProviderInterface`. The real Drupal
 * provider is backed by a database table (`router`) populated by the route
 * builder; for the initial port we ship an in-memory provider that satisfies
 * the same contract and is trivial to drive from tests.
 *
 * TODO(http): `getRouteCollectionForRequest()` takes a Symfony `Request` in
 * Drupal. There is no `@drupaljs/http` package yet, so we define a minimal
 * structural {@link RequestLike} (just the path) locally and swap it for the
 * shared Request type when it lands. Matching by request is delegated to the
 * {@link PathMatcher} seam (TS regex fallback today, WASM `route-matcher`
 * crate #41 tomorrow — see [[ADR-0015]]).
 */

import type { Route } from './route.js';
import { RouteCollection } from './route-collection.js';
import { RegexPathMatcher, type PathMatcher } from './path-matcher.js';

/** Thrown when a route name cannot be resolved. Mirrors Symfony's exception. */
export class RouteNotFoundException extends Error {
  constructor(name: string) {
    super(`Route "${name}" does not exist.`);
    this.name = 'RouteNotFoundException';
  }
}

/**
 * Minimal structural request — only the path is needed to find candidate
 * routes. TODO(http): replace with the shared `@drupaljs/http` Request.
 */
export interface RequestLike {
  /** The request path info, e.g. `/node/12`. */
  readonly pathInfo: string;
}

/** Port of Drupal `Core\Routing\RouteProviderInterface`. */
export interface RouteProviderInterface {
  /** Routes that may match the request, sorted highest-fit first. */
  getRouteCollectionForRequest(request: RequestLike): RouteCollection;

  /**
   * Find a route by name.
   * @throws {RouteNotFoundException} when no route has that name.
   */
  getRouteByName(name: string): Route;

  /**
   * Find many routes by name. Missing names are skipped (no throw). When
   * `names` is `null`, returns every known route.
   */
  getRoutesByNames(names: string[] | null): Record<string, Route>;

  /** All routes whose path contains the given pattern, highest-fit first. */
  getRoutesByPattern(pattern: string): RouteCollection;

  /** Every route on the system, keyed by name. Discouraged for perf. */
  getAllRoutes(): Record<string, Route>;

  /** Reset any cached state. */
  reset(): void;
}

/**
 * In-memory {@link RouteProviderInterface}. Routes are registered up front (or
 * from a {@link RouteCollection}); request matching uses the injected
 * {@link PathMatcher}.
 */
export class InMemoryRouteProvider implements RouteProviderInterface {
  private readonly routes = new Map<string, Route>();
  private readonly matcher: PathMatcher;

  constructor(matcher: PathMatcher = new RegexPathMatcher()) {
    this.matcher = matcher;
  }

  /** Register a single route under a name (replaces an existing one). */
  addRoute(name: string, route: Route): this {
    this.routes.set(name, route);
    return this;
  }

  /** Register every route in a collection. */
  addCollection(collection: RouteCollection): this {
    for (const [name, route] of collection) {
      this.routes.set(name, route);
    }
    return this;
  }

  getRouteCollectionForRequest(request: RequestLike): RouteCollection {
    const collection = new RouteCollection();
    const matches: Array<{ name: string; route: Route; fit: number }> = [];
    for (const [name, route] of this.routes) {
      if (this.matcher.match(request.pathInfo, route) !== null) {
        matches.push({ name, route, fit: pathFit(route) });
      }
    }
    sortByFitThenName(matches);
    for (const { name, route } of matches) {
      collection.add(name, route);
    }
    return collection;
  }

  getRouteByName(name: string): Route {
    const route = this.routes.get(name);
    if (route === undefined) {
      throw new RouteNotFoundException(name);
    }
    return route;
  }

  getRoutesByNames(names: string[] | null): Record<string, Route> {
    if (names === null) {
      return this.getAllRoutes();
    }
    const result: Record<string, Route> = {};
    for (const name of names) {
      const route = this.routes.get(name);
      if (route !== undefined) {
        result[name] = route;
      }
    }
    return result;
  }

  getRoutesByPattern(pattern: string): RouteCollection {
    const collection = new RouteCollection();
    const matches: Array<{ name: string; route: Route; fit: number }> = [];
    for (const [name, route] of this.routes) {
      if (route.getPath().includes(pattern)) {
        matches.push({ name, route, fit: pathFit(route) });
      }
    }
    sortByFitThenName(matches);
    for (const { name, route } of matches) {
      collection.add(name, route);
    }
    return collection;
  }

  getAllRoutes(): Record<string, Route> {
    return Object.fromEntries(this.routes);
  }

  reset(): void {
    // In-memory provider holds no derived cache; nothing to reset. The method
    // exists to satisfy the interface and match Drupal's lifecycle.
  }
}

/**
 * "Fit" = number of non-empty path parts, used to order candidates from most
 * to least specific (mirrors Drupal's fit-based ordering). Static parts and
 * placeholders both count as a part.
 */
function pathFit(route: Route): number {
  return route
    .getPath()
    .split('/')
    .filter((part) => part !== '').length;
}

function sortByFitThenName(
  matches: Array<{ name: string; route: Route; fit: number }>,
): void {
  matches.sort((a, b) => (b.fit - a.fit) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
