/**
 * @drupaljs/routing — TypeScript port of Drupal core's Routing subsystem.
 *
 * Ported from `drupal-core/core/lib/Drupal/Core/Routing` (whose Route /
 * RouteCollection come from Symfony Routing). Surface:
 *
 *   - {@link Route} / {@link RouteCollection} — the route value object + bag.
 *   - {@link RouteProviderInterface} + {@link InMemoryRouteProvider} — lookup by
 *     name / pattern / request.
 *   - {@link RouteMatchInterface} + {@link RouteMatch} / {@link NullRouteMatch} —
 *     the result of routing.
 *   - {@link UrlGenerator} — `generateFromRoute` with parameter substitution,
 *     query string and fragment assembly.
 *   - {@link PathMatcher} — the seam for compiled path matching. Ships a TS
 *     regex fallback ({@link RegexPathMatcher}); the perf-critical version is
 *     the Rust→WASM `route-matcher` crate (port task #41, [[ADR-0015]]).
 */

export {
  Route,
  type RouteDefaults,
  type RouteRequirements,
  type RouteOptions,
} from './route.js';

export { RouteCollection } from './route-collection.js';

export {
  compileRoute,
  type CompiledRoute,
  type RouteToken,
  type TextToken,
  type VariableToken,
} from './route-compiler.js';

export {
  RegexPathMatcher,
  type PathMatcher,
  type PathMatchResult,
} from './path-matcher.js';

export {
  InMemoryRouteProvider,
  RouteNotFoundException,
  type RouteProviderInterface,
  type RequestLike,
} from './route-provider.js';

export {
  RouteMatch,
  NullRouteMatch,
  type RouteMatchInterface,
} from './route-match.js';

export {
  UrlGenerator,
  ReferenceType,
  DEFAULT_CONTEXT,
  MissingMandatoryParametersException,
  InvalidParameterException,
  type RequestContext,
  type UrlGenerateOptions,
} from './url-generator.js';
