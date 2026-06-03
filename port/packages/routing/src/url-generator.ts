/**
 * UrlGenerator — port of Drupal `Core\Routing\UrlGenerator`, focused on
 * `generateFromRoute`: parameter substitution into the route path plus query
 * string and fragment assembly, with optional absolute URLs.
 *
 * The token-walk in {@link doGenerate} is a faithful port of Drupal's
 * `UrlGenerator::doGenerate()` (itself a trimmed copy of Symfony's generator):
 * tokens are consumed right-to-left, trailing optional variables that equal
 * their default are omitted, requirements are enforced, and leftover parameters
 * spill into the query string.
 *
 * Out of scope for this layer (handled by higher subsystems in Drupal):
 * outbound path/route processors, bubbleable cache metadata. Those are noted
 * with TODOs where the seams would attach.
 */

import type { Route } from './route.js';
import { compileRoute, type RouteToken } from './route-compiler.js';
import type { RouteProviderInterface } from './route-provider.js';

/** Reference type for generated URLs, mirroring Symfony's constants. */
export enum ReferenceType {
  /** A path relative to the application root, e.g. `/node/1`. */
  ABSOLUTE_PATH = 0,
  /** A full URL with scheme + host, e.g. `https://example.com/node/1`. */
  ABSOLUTE_URL = 1,
}

/**
 * Minimal request context (scheme/host/port/base URL) used to build absolute
 * URLs. Port of the subset of Symfony's `RequestContext` that Drupal's
 * generator reads.
 */
export interface RequestContext {
  readonly scheme: string;
  readonly host: string;
  readonly httpPort: number;
  readonly httpsPort: number;
  readonly baseUrl: string;
}

export const DEFAULT_CONTEXT: RequestContext = {
  scheme: 'http',
  host: '',
  httpPort: 80,
  httpsPort: 443,
  baseUrl: '',
};

/** Options accepted by {@link UrlGenerator.generateFromRoute}. */
export interface UrlGenerateOptions {
  /** Build an absolute URL (scheme + host) instead of a path. */
  absolute?: boolean;
  /** Extra query parameters merged with any leftover route parameters. */
  query?: Record<string, unknown>;
  /** Fragment appended after `#` (without the leading `#`). */
  fragment?: string;
  /** Force scheme regardless of context, when building absolute URLs. */
  https?: boolean;
}

/** Thrown when a mandatory route variable has no supplied value. */
export class MissingMandatoryParametersException extends Error {
  constructor(routeName: string, missing: string[]) {
    super(
      `Some mandatory parameters are missing ("${missing.join('", "')}") to generate a URL for route "${routeName}".`,
    );
    this.name = 'MissingMandatoryParametersException';
  }
}

/** Thrown when a supplied parameter value violates the route's requirement. */
export class InvalidParameterException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParameterException';
  }
}

export class UrlGenerator {
  private context: RequestContext;

  constructor(
    private readonly provider: RouteProviderInterface,
    context: RequestContext = DEFAULT_CONTEXT,
  ) {
    this.context = context;
  }

  setContext(context: RequestContext): void {
    this.context = context;
  }

  getContext(): RequestContext {
    return this.context;
  }

  /**
   * Convenience matching Symfony's `generate()`: resolve a route by name and
   * build a path (or absolute URL when `referenceType` is `ABSOLUTE_URL`).
   */
  generate(
    name: string,
    parameters: Record<string, unknown> = {},
    referenceType: ReferenceType = ReferenceType.ABSOLUTE_PATH,
  ): string {
    return this.generateFromRoute(name, parameters, {
      absolute: referenceType === ReferenceType.ABSOLUTE_URL,
    });
  }

  /**
   * Core generator: substitute `parameters` into the named route's path, append
   * leftover parameters and explicit `options.query` as a query string, then a
   * fragment, optionally prefixing scheme/host for an absolute URL.
   */
  generateFromRoute(
    name: string,
    parameters: Record<string, unknown> = {},
    options: UrlGenerateOptions = {},
  ): string {
    const route = this.provider.getRouteByName(name).clone();
    const query: Record<string, unknown> = { ...(options.query ?? {}) };

    // Relative URL with no path (Drupal's `_no_path` option): query + fragment.
    if (route.getOption('_no_path') === true) {
      return buildQueryString(query) + buildFragment(options.fragment);
    }

    let path = this.getInternalPathFromRoute(name, route, parameters, query);

    // Guard against accidental protocol-relative URLs (`//host`).
    if (path.startsWith('//')) {
      path = `/${path.replace(/^\/+/, '')}`;
    }

    const queryString = buildQueryString(query);
    const fragment = buildFragment(options.fragment);

    if (!options.absolute || this.context.host === '') {
      return this.context.baseUrl + path + queryString + fragment;
    }

    // Absolute URL: scheme + host + optional non-default port.
    const scheme = options.https === undefined
      ? this.context.scheme
      : options.https
        ? 'https'
        : 'http';
    let port = '';
    if (scheme === 'http' && this.context.httpPort !== 80) {
      port = `:${this.context.httpPort}`;
    } else if (scheme === 'https' && this.context.httpsPort !== 443) {
      port = `:${this.context.httpsPort}`;
    }
    return `${scheme}://${this.context.host}${port}${this.context.baseUrl}${path}${queryString}${fragment}`;
  }

  /** Compile the route and substitute parameters into its path. */
  private getInternalPathFromRoute(
    name: string,
    route: Route,
    parameters: Record<string, unknown>,
    query: Record<string, unknown>,
  ): string {
    const compiled = compileRoute(route);
    return doGenerate(
      compiled.variables,
      route.getDefaults(),
      compiled.tokens,
      parameters,
      query,
      name,
    );
  }
}

/**
 * Port of Drupal `UrlGenerator::doGenerate()`. Walks the token stream
 * right-to-left, dropping trailing optional variables that match their default,
 * enforcing requirements, and collecting leftover parameters into `query`.
 */
function doGenerate(
  variables: readonly string[],
  defaults: Record<string, unknown>,
  tokens: readonly RouteToken[],
  parameters: Record<string, unknown>,
  query: Record<string, unknown>,
  name: string,
): string {
  const variableSet = new Set(variables);
  const merged: Record<string, unknown> = { ...defaults, ...parameters };

  // All path variables must have a value.
  const missing = variables.filter((v) => !(v in merged));
  if (missing.length > 0) {
    throw new MissingMandatoryParametersException(name, missing);
  }

  let url = '';
  let optional = true;
  // Tokens are walked from the end of the path toward the beginning.
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i] as RouteToken;
    if (token[0] === 'variable') {
      const [, text, requirement, varName] = token;
      const value = merged[varName];
      const hasDefault = Object.prototype.hasOwnProperty.call(defaults, varName);
      const differsFromDefault =
        value !== undefined && String(value) !== String(defaults[varName]);

      if (!optional || !hasDefault || differsFromDefault) {
        const stringValue = value === undefined || value === null ? '' : String(value);
        if (!new RegExp(`^${requirement}$`).test(stringValue)) {
          throw new InvalidParameterException(
            `Parameter "${varName}" for route "${name}" must match "${requirement}" ("${stringValue}" given) to generate a corresponding URL.`,
          );
        }
        url = text + stringValue + url;
        optional = false;
      }
    } else {
      url = token[1] + url;
      optional = false;
    }
  }

  if (url === '') {
    url = '/';
  }

  // Leftover parameters (not path variables, not defaults) become query params.
  for (const [key, value] of Object.entries(parameters)) {
    if (!variableSet.has(key) && !(key in defaults)) {
      query[key] = value;
    }
  }

  return url;
}

/** Build a `?a=1&b=2` query string (empty when no params). */
function buildQueryString(query: Record<string, unknown>): string {
  const entries = Object.entries(query);
  if (entries.length === 0) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, String(item));
      }
    } else {
      search.append(key, String(value));
    }
  }
  const str = search.toString();
  return str === '' ? '' : `?${str}`;
}

/** Build a `#fragment` (empty when blank). */
function buildFragment(fragment: string | undefined): string {
  if (fragment === undefined) {
    return '';
  }
  const trimmed = fragment.trim();
  return trimmed === '' ? '' : `#${trimmed}`;
}
