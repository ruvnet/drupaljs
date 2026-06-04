/**
 * Local seam types for `@drupaljs/module-big_pipe`.
 *
 * Source: drupal-core/core/modules/big_pipe.
 *
 * The big_pipe module sits on top of several core subsystems (render placeholder
 * strategy, routing, session, HTTP foundation). Those canonical `@drupaljs/*`
 * packages either do not exist yet or do not export the precise contracts this
 * module needs, so the minimal surface is captured here with TODO markers.
 */

/**
 * A render array, modelled structurally. Drupal render arrays are nested maps
 * whose keys are either child elements or `#`-prefixed properties.
 *
 * TODO(@drupaljs/render): replace with the canonical RenderArray type once the
 * render package exports one.
 */
export type RenderArray = Record<string, unknown>;

/**
 * The placeholder map processed by a placeholder strategy: keyed by the literal
 * placeholder string, valued by the placeholder's render array.
 *
 * Ports the `$placeholders` parameter of `PlaceholderStrategyInterface`.
 */
export type PlaceholderMap = Record<string, RenderArray>;

/**
 * Ports `Drupal\Core\Render\Placeholder\PlaceholderStrategyInterface`.
 *
 * TODO(@drupaljs/render): import from the render package once it lands.
 */
export interface PlaceholderStrategyInterface {
  /**
   * Transforms placeholders, returning the subset of overridden placeholders.
   */
  processPlaceholders(placeholders: PlaceholderMap): PlaceholderMap;
}

/**
 * Minimal HTTP request seam.
 *
 * Ports the parts of `Symfony\Component\HttpFoundation\Request` that BigPipe's
 * placeholder strategy and controller read.
 *
 * TODO(@drupaljs/http-kernel): replace with the canonical Request type.
 */
export interface RequestLike {
  /** Cookie bag with a Drupal/Symfony-style `has(name)` accessor. */
  readonly cookies: { has(name: string): boolean; get?(name: string): unknown };
  /** Query bag with `has(name)` / `get(name)`. */
  readonly query: { has(name: string): boolean; get(name: string): string | null };
  /**
   * Whether the request method is cacheable (GET/HEAD). Mirrors
   * `Request::isMethodCacheable()`.
   */
  isMethodCacheable(): boolean;
}

/**
 * Minimal request-stack seam.
 *
 * Ports `Symfony\Component\HttpFoundation\RequestStack` members used by BigPipe.
 */
export interface RequestStackLike {
  getCurrentRequest(): RequestLike | null;
  getParentRequest(): RequestLike | null;
}

/**
 * Minimal route seam — only `getOption` is consulted by BigPipe.
 *
 * TODO(@drupaljs/routing): replace with the canonical Route type.
 */
export interface RouteLike {
  getOption(name: string): unknown;
  setOption(name: string, value: unknown): void;
}

/**
 * Ports `Drupal\Core\Routing\RouteMatchInterface` (only `getRouteObject`).
 */
export interface RouteMatchLike {
  getRouteObject(): RouteLike | null;
}

/**
 * Ports `Drupal\Core\Session\SessionConfigurationInterface` (only `hasSession`).
 */
export interface SessionConfigurationLike {
  hasSession(request: RequestLike): boolean;
}

/**
 * A read-only collection of named routes.
 *
 * Ports the `get()` accessor of Symfony's `RouteCollection`.
 */
export interface RouteCollectionLike {
  get(name: string): RouteLike | undefined;
}

/**
 * Ports `Drupal\Core\Routing\RouteBuildEvent` (only the collection accessor).
 */
export interface RouteBuildEventLike {
  getRouteCollection(): RouteCollectionLike;
}

/**
 * Minimal hook-registration seam.
 *
 * Mirrors the single method of `@drupaljs/hook`'s `ModuleHandlerInterface`
 * needed to register this module's hook implementations.
 *
 * TODO(@drupaljs/hook): import `ModuleHandlerInterface` once cross-package
 * resolution is enabled; this captures only the `implement` surface.
 */
export interface HookRegistrarLike {
  implement(
    module: string,
    hook: string,
    callback: (...args: any[]) => unknown,
  ): void;
}
