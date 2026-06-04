/**
 * RouteMatchInterface + RouteMatch + NullRouteMatch — port of Drupal
 * `Core\Routing\{RouteMatchInterface, RouteMatch, NullRouteMatch}`.
 *
 * A route match is the result of routing: the matched route name + object plus
 * two parameter bags — *raw* (string values straight from the URL) and
 * *processed* (after upcasting; identical to raw in this layer since parameter
 * upcasting belongs to a higher subsystem). Per Drupal, parameters are
 * pre-filtered to only the route's variables plus any default whose name does
 * not start with `_`.
 */

import type { Route } from './route.js';
import { compileRoute } from './route-compiler.js';

/** Port of Drupal `Core\Routing\RouteMatchInterface`. */
export interface RouteMatchInterface {
  /** The matched route name, or `null` when nothing matched. */
  getRouteName(): string | null;
  /** The matched route object, or `null` when nothing matched. */
  getRouteObject(): Route | null;
  /** A single processed (upcast) parameter, or `null`. */
  getParameter(parameterName: string): unknown;
  /** All processed parameters. */
  getParameters(): Record<string, unknown>;
  /** A single raw (string) parameter, or `null`. */
  getRawParameter(parameterName: string): string | null;
  /** All raw parameters. */
  getRawParameters(): Record<string, string>;
}

/** Default route match. */
export class RouteMatch implements RouteMatchInterface {
  private readonly routeName: string;
  private readonly route: Route;
  private readonly parameters: Record<string, unknown>;
  private readonly rawParameters: Record<string, string>;

  constructor(
    routeName: string,
    route: Route,
    parameters: Record<string, unknown> = {},
    rawParameters: Record<string, string> = {},
  ) {
    this.routeName = routeName;
    this.route = route;

    // Pre-filter parameters to the route's parameter names (Drupal behaviour).
    const names = parameterNames(route);
    this.parameters = pick(parameters, names);
    this.rawParameters = pick(rawParameters, names);
  }

  getRouteName(): string | null {
    return this.routeName;
  }

  getRouteObject(): Route | null {
    return this.route;
  }

  getParameter(parameterName: string): unknown {
    return Object.prototype.hasOwnProperty.call(this.parameters, parameterName)
      ? this.parameters[parameterName]
      : null;
  }

  getParameters(): Record<string, unknown> {
    return { ...this.parameters };
  }

  getRawParameter(parameterName: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.rawParameters, parameterName)
      ? (this.rawParameters[parameterName] as string)
      : null;
  }

  getRawParameters(): Record<string, string> {
    return { ...this.rawParameters };
  }
}

/**
 * Null Object route match — returned when there is no matched route (404, or
 * before routing runs). Port of Drupal `Core\Routing\NullRouteMatch`.
 */
export class NullRouteMatch implements RouteMatchInterface {
  getRouteName(): string | null {
    return null;
  }

  getRouteObject(): Route | null {
    return null;
  }

  getParameter(_parameterName: string): unknown {
    return null;
  }

  getParameters(): Record<string, unknown> {
    return {};
  }

  getRawParameter(_parameterName: string): string | null {
    return null;
  }

  getRawParameters(): Record<string, string> {
    return {};
  }
}

/**
 * The names of all parameters for a route: every path variable, plus any
 * default whose name does not begin with `_`. Mirrors Drupal
 * `RouteMatch::getParameterNames()`.
 */
function parameterNames(route: Route): Set<string> {
  const names = new Set<string>(compileRoute(route).variables);
  for (const name of Object.keys(route.getDefaults())) {
    if (!name.startsWith('_')) {
      names.add(name);
    }
  }
  return names;
}

function pick<T>(source: Record<string, T>, names: Set<string>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(source, name)) {
      out[name] = source[name] as T;
    }
  }
  return out;
}
