/**
 * Local, minimal contracts the rest module depends on from other Drupal
 * subsystems that are not yet ported. Each is a faithful but reduced surface of
 * the real Drupal interface; replace with the shared `@drupaljs/*` type when it
 * lands.
 */

/**
 * A single permission definition as exposed to the permissions system.
 * Ports the shape produced by `*.permissions.yml` / permission callbacks.
 *
 * TODO(@drupaljs/module-system): re-use the shared PermissionDefinition once it
 * is exported from a common package.
 */
export interface PermissionDefinition {
  title: string;
  description?: string;
  /** When true, the permission is security-sensitive. */
  restrict_access?: boolean;
  /**
   * Config-dependency metadata attached by RestPermissions. Keyed by dependency
   * type (e.g. `config`), value is a list of dependency names.
   */
  dependencies?: Record<string, string[]>;
}

/** A keyed map of permission machine name -> definition. */
export type PermissionMap = Record<string, PermissionDefinition>;

/**
 * Minimal route definition surface. Ports the relevant subset of a
 * `Symfony\Component\Routing\Route` actually exercised by the rest module:
 * a path, defaults, requirements, options, and the allowed HTTP methods.
 *
 * TODO(@drupaljs/routing): replace with the shared Route type.
 */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, unknown>;
  requirements?: Record<string, string>;
  options?: Record<string, unknown>;
  /** Allowed HTTP methods for this route (Route::getMethods()). */
  methods?: string[];
}

/** A keyed map of route name -> definition. */
export type RouteCollection = Record<string, RouteDefinition>;

/**
 * A logger surface (subset of Psr\Log\LoggerInterface) used by ResourceRoutes
 * to report misconfigured resources.
 *
 * TODO(@drupaljs/logger): replace with the shared LoggerInterface port.
 */
export interface LoggerInterface {
  error(message: string, context?: Record<string, unknown>): void;
}
