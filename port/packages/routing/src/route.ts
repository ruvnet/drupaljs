/**
 * Route — TypeScript port of Symfony's `Component\Routing\Route`, the value
 * object Drupal uses for every route.
 *
 * A route holds a `path` pattern (`/node/{id}`), a bag of `defaults`
 * (parameter fallbacks and Drupal's `_controller`/`_form`/`_title` directives),
 * `requirements` (per-variable regex constraints), and free-form `options`
 * (e.g. `_no_path`, `parameters`). We also carry `host`, `schemes` and
 * `methods` because Drupal's URL generator consults `getSchemes()`.
 *
 * Ported from Symfony Routing (the upstream of Drupal core's routing); see
 * Drupal `Core\Routing\RouteMatch::getParameterNames()` and
 * `Core\Routing\UrlGenerator` for the consumers of this surface.
 */

export type RouteDefaults = Record<string, unknown>;
export type RouteRequirements = Record<string, string>;
export type RouteOptions = Record<string, unknown>;

export class Route {
  private path: string;
  private host: string;
  private readonly defaults: RouteDefaults = {};
  private readonly requirements: RouteRequirements = {};
  private readonly options: RouteOptions = {};
  private schemes: string[] = [];
  private methods: string[] = [];

  /**
   * Bumped on every structural mutation (path/requirements) so memoised
   * compilation ({@link compileRoute}) knows to recompute.
   */
  private compileVersion = 0;

  constructor(
    path: string,
    defaults: RouteDefaults = {},
    requirements: RouteRequirements = {},
    options: RouteOptions = {},
    host = '',
    schemes: string | string[] = [],
    methods: string | string[] = [],
  ) {
    this.path = normalizePath(path);
    this.host = host;
    this.addDefaults(defaults);
    this.addRequirements(requirements);
    this.addOptions(options);
    this.setSchemes(schemes);
    this.setMethods(methods);
  }

  getPath(): string {
    return this.path;
  }

  setPath(pattern: string): this {
    this.path = normalizePath(pattern);
    this.bump();
    return this;
  }

  getHost(): string {
    return this.host;
  }

  setHost(pattern: string): this {
    this.host = pattern;
    this.bump();
    return this;
  }

  // --- defaults -----------------------------------------------------------

  getDefaults(): RouteDefaults {
    return { ...this.defaults };
  }

  hasDefault(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.defaults, name);
  }

  getDefault(name: string): unknown {
    return this.hasDefault(name) ? this.defaults[name] : null;
  }

  setDefault(name: string, value: unknown): this {
    this.defaults[name] = value;
    return this;
  }

  addDefaults(defaults: RouteDefaults): this {
    for (const [name, value] of Object.entries(defaults)) {
      this.defaults[name] = value;
    }
    return this;
  }

  // --- requirements -------------------------------------------------------

  getRequirements(): RouteRequirements {
    return { ...this.requirements };
  }

  hasRequirement(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.requirements, key);
  }

  getRequirement(key: string): string | null {
    return this.hasRequirement(key) ? (this.requirements[key] as string) : null;
  }

  setRequirement(key: string, regex: string): this {
    this.requirements[key] = sanitizeRequirement(regex);
    this.bump();
    return this;
  }

  addRequirements(requirements: RouteRequirements): this {
    for (const [key, regex] of Object.entries(requirements)) {
      this.requirements[key] = sanitizeRequirement(regex);
    }
    this.bump();
    return this;
  }

  // --- options ------------------------------------------------------------

  getOptions(): RouteOptions {
    return { ...this.options };
  }

  hasOption(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.options, name);
  }

  getOption(name: string): unknown {
    return this.hasOption(name) ? this.options[name] : null;
  }

  setOption(name: string, value: unknown): this {
    this.options[name] = value;
    return this;
  }

  addOptions(options: RouteOptions): this {
    for (const [name, value] of Object.entries(options)) {
      this.options[name] = value;
    }
    return this;
  }

  // --- schemes & methods --------------------------------------------------

  getSchemes(): string[] {
    return [...this.schemes];
  }

  setSchemes(schemes: string | string[]): this {
    this.schemes = toUpperList(schemes).map((s) => s.toLowerCase());
    return this;
  }

  getMethods(): string[] {
    return [...this.methods];
  }

  setMethods(methods: string | string[]): this {
    this.methods = toUpperList(methods);
    return this;
  }

  /** Internal: structural version used by the compiler's memoisation cache. */
  getCompileVersion(): number {
    return this.compileVersion;
  }

  /** Deep-ish copy mirroring Symfony's `clone $route` in the URL generator. */
  clone(): Route {
    return new Route(
      this.path,
      { ...this.defaults },
      { ...this.requirements },
      { ...this.options },
      this.host,
      [...this.schemes],
      [...this.methods],
    );
  }

  private bump(): void {
    this.compileVersion++;
  }
}

function normalizePath(pattern: string): string {
  // Symfony stores paths starting with exactly one slash and collapses repeats.
  let p = pattern.replace(/\/{2,}/g, '/');
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}

function sanitizeRequirement(regex: string): string {
  // Symfony strips a single leading ^ and trailing $ from requirements.
  let r = regex;
  if (r.startsWith('^')) r = r.slice(1);
  if (r.endsWith('$')) r = r.slice(0, -1);
  return r;
}

function toUpperList(value: string | string[]): string[] {
  const arr = Array.isArray(value) ? value : value === '' ? [] : [value];
  return arr.map((v) => v.toUpperCase());
}
