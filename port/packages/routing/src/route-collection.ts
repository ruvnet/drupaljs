/**
 * RouteCollection — TypeScript port of Symfony's
 * `Component\Routing\RouteCollection`, an ordered, name-keyed bag of routes.
 *
 * Drupal's `RouteProviderInterface` returns these from
 * `getRouteCollectionForRequest()` / `getRoutesByPattern()`. Insertion order is
 * preserved and adding a route under an existing name replaces it but keeps the
 * original position — matching Symfony semantics (its `add()` unsets then sets).
 */

import type { Route } from './route.js';

export class RouteCollection implements Iterable<[string, Route]> {
  private readonly routes = new Map<string, Route>();

  /**
   * Add (or replace) a route by name. Re-adding an existing name replaces the
   * route but preserves Symfony's "remove then append" ordering.
   */
  add(name: string, route: Route): void {
    this.routes.delete(name);
    this.routes.set(name, route);
  }

  /** Get a route by name, or `null` if absent. */
  get(name: string): Route | null {
    return this.routes.get(name) ?? null;
  }

  /** Remove one or more routes by name. */
  remove(name: string | string[]): void {
    const names = Array.isArray(name) ? name : [name];
    for (const n of names) {
      this.routes.delete(n);
    }
  }

  /** All routes keyed by name, in insertion order. */
  all(): Record<string, Route> {
    return Object.fromEntries(this.routes);
  }

  /** Number of routes in the collection. */
  count(): number {
    return this.routes.size;
  }

  /** All route names in insertion order. */
  keys(): string[] {
    return [...this.routes.keys()];
  }

  /**
   * Merge another collection into this one (its routes win on name clashes,
   * mirroring Symfony's `addCollection()`).
   */
  addCollection(collection: RouteCollection): void {
    for (const [name, route] of collection) {
      this.add(name, route);
    }
  }

  [Symbol.iterator](): Iterator<[string, Route]> {
    return this.routes.entries();
  }
}
