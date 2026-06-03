/**
 * PathMatcher — the seam between the routing system and compiled path matching.
 *
 * Drupal/Symfony compile a route path like `/node/{id}` into a regular
 * expression plus a token stream used for both *matching* an incoming path and
 * *generating* a URL. The compiled-regex matching half is CPU-bound and will be
 * implemented in the Rust→WASM `route-matcher` crate (port task #41, see
 * [[ADR-0015]]). Until that crate lands, this module ships a minimal,
 * dependency-free TypeScript regex fallback so the rest of the routing system
 * (collection, provider, URL generator, route match) can be built and tested.
 *
 * TODO(#41): replace `RegexPathMatcher` with a thin wrapper over the WASM
 * `route-matcher` crate. Keep this `PathMatcher` interface stable so the swap is
 * transparent to callers.
 */

import type { Route } from './route.js';
import { compileRoute, type CompiledRoute } from './route-compiler.js';

/** The result of matching a path against a single route. */
export interface PathMatchResult {
  /** The raw (non-upcast) parameter values pulled from the path. */
  readonly parameters: Record<string, string>;
}

/**
 * Matches request paths against compiled routes.
 *
 * Implementations must be pure with respect to the route: matching `/node/12`
 * against `/node/{id}` yields `{ id: '12' }` and never mutates the route.
 */
export interface PathMatcher {
  /**
   * Attempt to match `path` against `route`.
   *
   * @returns the extracted raw parameters when the path matches, or `null` when
   *   it does not. Defaults declared on the route but absent from the path are
   *   filled in (mirroring Symfony's matcher behaviour).
   */
  match(path: string, route: Route): PathMatchResult | null;
}

/**
 * Minimal TS regex implementation of {@link PathMatcher}.
 *
 * This compiles each route on demand (results are memoised on the compiled
 * route, see {@link compileRoute}) and matches with the host `RegExp` engine.
 * It is intentionally simple — no host matching, no UTF-8 fast paths — because
 * the performance-critical version is the WASM crate (#41).
 */
export class RegexPathMatcher implements PathMatcher {
  match(path: string, route: Route): PathMatchResult | null {
    const compiled: CompiledRoute = compileRoute(route);
    const normalized = normalizePath(path);
    const m = compiled.regex.exec(normalized);
    if (m === null) {
      return null;
    }

    const parameters: Record<string, string> = {};
    // Seed with defaults for variables, then overwrite with captured values.
    const defaults = route.getDefaults();
    for (const name of compiled.variables) {
      const def = defaults[name];
      if (def !== undefined && def !== null) {
        parameters[name] = String(def);
      }
    }
    // Named capture groups are keyed by variable name in the compiled regex.
    const groups = m.groups ?? {};
    for (const name of compiled.variables) {
      const captured = groups[name];
      if (captured !== undefined) {
        parameters[name] = captured;
      }
    }
    return { parameters };
  }
}

/** Collapse to a single leading slash and drop a trailing slash (except root). */
function normalizePath(path: string): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}
