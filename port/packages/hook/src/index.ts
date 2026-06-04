/**
 * @drupaljs/hook — TypeScript port of Drupal core's module/hook system.
 *
 * Ports `Drupal\Core\Extension\ModuleHandler` (and its interface) from
 * drupal-core/core/lib/Drupal/Core/Extension. The original discovers hook
 * implementations by scanning PHP files for `MODULE_HOOK()` functions and
 * `#[Hook]` attributes. There is no PHP file scanning here, so this port exposes
 * an explicit **registration API** (`implement()`) for modules to declare their
 * hook implementations — the TS-idiomatic equivalent of discovery.
 *
 * Ordering matches Drupal: implementations run ordered by ascending module
 * weight, then alphabetically by module machine name, then in registration order
 * within a single module.
 */

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/**
 * A hook implementation callable. Returns a value (for invoke/invokeAll) or
 * mutates its arguments by reference (for alter).
 */
export type HookCallback = (...args: any[]) => unknown;

/**
 * Callback passed to {@link ModuleHandlerInterface.invokeAllWith}, receiving the
 * hook listener and the implementing module's machine name.
 */
export type InvokeAllWithCallback = (listener: HookCallback, module: string) => void;

/**
 * Minimal extension (module) descriptor.
 *
 * Ports the relevant surface of `Drupal\Core\Extension\Extension`. The full
 * Extension class lives in another package; only the fields the hook system
 * needs are modelled here.
 *
 * TODO(@drupaljs/extension): replace with the shared Extension type once the
 * extension package lands.
 */
export interface Module {
  /** Machine name, e.g. "node". */
  readonly name: string;
  /**
   * Module weight. Lower weights run earlier. Defaults to 0 when omitted.
   * In Drupal this comes from the system.module config / .info.yml.
   */
  readonly weight?: number;
  /**
   * Parsed `.info.yml` data. `dependencies` is an array of module name strings;
   * `path` is the module directory.
   */
  readonly info?: ModuleInfo;
  /** Dependency-graph results populated by {@link ModuleHandler.buildModuleDependencies}. */
  requires?: Record<string, unknown>;
  required_by?: Record<string, unknown>;
  sort?: number;
}

export interface ModuleInfo {
  dependencies?: string[];
  path?: string;
  [key: string]: unknown;
}

/** Map of active modules keyed by machine name. */
export type ModuleList = Record<string, Module>;

/**
 * Thrown when a requested module is not in the active module list.
 *
 * Ports `Drupal\Core\Extension\Exception\UnknownExtensionException`.
 */
export class UnknownExtensionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownExtensionException';
  }
}

/**
 * Manages a fixed set of enabled modules and their hook implementations.
 *
 * Ports `Drupal\Core\Extension\ModuleHandlerInterface`. PHP-file-scanning,
 * include-loading, and deprecated members from the original interface are
 * intentionally omitted (no procedural include files in the TS port).
 */
export interface ModuleHandlerInterface {
  /** Returns the active module list keyed by machine name. */
  getModuleList(): ModuleList;
  /** Returns a module by name, or throws {@link UnknownExtensionException}. */
  getModule(name: string): Module;
  /** Replaces the active module list and resets the implementation cache. */
  setModuleList(moduleList?: ModuleList): void;
  /** True when the named module is enabled. */
  moduleExists(module: string): boolean;
  /** Returns module directories keyed by machine name. */
  getModuleDirectories(): Record<string, string>;
  /** Computes `requires` / `required_by` for each module from its dependencies. */
  buildModuleDependencies(modules: ModuleList): ModuleList;

  /** Registers a hook implementation for a module. */
  implement(module: string, hook: string, callback: HookCallback): void;
  /** Drops the cached/derived implementation ordering. */
  resetImplementations(): void;
  /** True if the given module(s) — or any module — implement the hook. */
  hasImplementations(hook: string, modules?: string | string[] | null): boolean;
  /** Returns implementing module names in execution order. */
  getImplementations(hook: string): string[];

  /** Invokes the callback once per implementation, in order. */
  invokeAllWith(hook: string, callback: InvokeAllWithCallback): void;
  /** Invokes the hook in a single module; returns its value or undefined. */
  invoke(module: string, hook: string, args?: unknown[]): unknown;
  /** Invokes the hook in all implementing modules; collects/merges results. */
  invokeAll(hook: string, args?: unknown[]): unknown;
  /** Runs `<type>_alter` implementations to mutate `data` (and contexts). */
  alter(
    type: string | string[],
    data: unknown,
    context1?: unknown,
    context2?: unknown,
  ): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

interface Registration {
  readonly module: string;
  readonly callback: HookCallback;
  /** Monotonic counter to preserve registration order within a module. */
  readonly seq: number;
}

export class ModuleHandler implements ModuleHandlerInterface {
  private moduleList: ModuleList = {};

  /** hook name -> registrations (across all registered modules). */
  private readonly registry = new Map<string, Registration[]>();

  /** Cache: hook name -> ordered registrations from *enabled* modules. */
  private readonly implementationCache = new Map<string, Registration[]>();

  private seq = 0;

  // -- Module registry -----------------------------------------------------

  getModuleList(): ModuleList {
    return this.moduleList;
  }

  getModule(name: string): Module {
    const module = this.moduleList[name];
    if (module === undefined) {
      throw new UnknownExtensionException(`The module ${name} does not exist.`);
    }
    return module;
  }

  setModuleList(moduleList: ModuleList = {}): void {
    this.moduleList = moduleList;
    // A new module set may enable/disable implementations: drop the cache.
    this.resetImplementations();
  }

  moduleExists(module: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.moduleList, module);
  }

  getModuleDirectories(): Record<string, string> {
    const dirs: Record<string, string> = {};
    for (const [name, module] of Object.entries(this.moduleList)) {
      const path = module.info?.path;
      if (typeof path === 'string') {
        dirs[name] = path;
      }
    }
    return dirs;
  }

  buildModuleDependencies(modules: ModuleList): ModuleList {
    // Build a forward dependency map: module -> list of module names it requires.
    const edges: Record<string, string[]> = {};
    for (const module of Object.values(modules)) {
      const deps = module.info?.dependencies ?? [];
      // A dependency string can be "module" or "project:module (>=1.0)"; the
      // module machine name is the token after any ':' and before whitespace.
      edges[module.name] = deps.map(parseDependencyName);
    }

    // Initialise result fields.
    for (const module of Object.values(modules)) {
      module.requires = {};
      module.required_by = {};
    }

    // Populate requires / required_by from the edges. We follow only edges that
    // point to modules present in the set (Drupal's Graph does transitive
    // closure; for the active-module case direct edges suffice and keep this
    // pure-TS — full topological weighting is delegated to the dependency-graph
    // crate per ADR-0015).
    for (const [name, deps] of Object.entries(edges)) {
      const subject = modules[name];
      if (subject === undefined) continue;
      for (const dep of deps) {
        const target = modules[dep];
        if (target === undefined) continue;
        subject.requires![dep] = dep;
        target.required_by![name] = name;
      }
    }

    return modules;
  }

  // -- Hook registration & discovery ---------------------------------------

  implement(module: string, hook: string, callback: HookCallback): void {
    const list = this.registry.get(hook) ?? [];
    list.push({ module, callback, seq: this.seq++ });
    this.registry.set(hook, list);
    // Invalidate only the affected hook's cache.
    this.implementationCache.delete(hook);
  }

  resetImplementations(): void {
    this.implementationCache.clear();
  }

  hasImplementations(hook: string, modules: string | string[] | null = null): boolean {
    const ordered = this.getOrderedImplementations(hook);
    if (modules === null || modules === undefined) {
      return ordered.length > 0;
    }
    const wanted = Array.isArray(modules) ? modules : [modules];
    const present = new Set(ordered.map((r) => r.module));
    return wanted.some((m) => present.has(m));
  }

  getImplementations(hook: string): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const reg of this.getOrderedImplementations(hook)) {
      if (!seen.has(reg.module)) {
        seen.add(reg.module);
        result.push(reg.module);
      }
    }
    return result;
  }

  // -- Invocation ----------------------------------------------------------

  invokeAllWith(hook: string, callback: InvokeAllWithCallback): void {
    for (const reg of this.getOrderedImplementations(hook)) {
      callback(reg.callback, reg.module);
    }
  }

  invoke(module: string, hook: string, args: unknown[] = []): unknown {
    const listeners = this.getOrderedImplementations(hook).filter((r) => r.module === module);
    if (listeners.length === 0) {
      return undefined;
    }
    if (listeners.length > 1) {
      throw new Error(`Module ${module} should not implement ${hook} more than once`);
    }
    return listeners[0]!.callback(...args);
  }

  invokeAll(hook: string, args: unknown[] = []): unknown {
    let returnArray: unknown[] = [];
    let returnObject: Record<string, unknown> | null = null;

    this.invokeAllWith(hook, (listener) => {
      const result = listener(...args);
      if (result === null || result === undefined) {
        return;
      }
      if (isPlainObject(result) || Array.isArray(result)) {
        // Drupal merges array returns recursively (NestedArray::mergeDeep).
        returnObject = mergeDeep(returnObject ?? {}, result as Record<string, unknown>);
      } else {
        returnArray.push(result);
      }
    });

    // If any implementation returned a mergeable structure, that merged object
    // is the result; otherwise return the collected scalar list.
    return returnObject !== null && returnArray.length === 0 ? returnObject : returnArray;
  }

  alter(
    type: string | string[],
    data: unknown,
    context1?: unknown,
    context2?: unknown,
  ): void {
    const hooks = (Array.isArray(type) ? type : [type]).map((t) => `${t}_alter`);
    for (const listener of this.getCombinedListeners(hooks)) {
      listener(data, context1, context2);
    }
  }

  // -- Internal ordering ---------------------------------------------------

  /**
   * Returns the registrations for a hook from enabled modules, ordered by
   * module weight, then module name, then registration sequence. Memoised.
   */
  private getOrderedImplementations(hook: string): Registration[] {
    const cached = this.implementationCache.get(hook);
    if (cached !== undefined) {
      return cached;
    }
    const all = this.registry.get(hook) ?? [];
    const enabled = all.filter((r) => this.moduleExists(r.module));
    enabled.sort((a, b) => this.compareRegistrations(a, b));
    this.implementationCache.set(hook, enabled);
    return enabled;
  }

  /**
   * Builds the combined, de-duplicated listener list for an alter() call across
   * one or more `<type>_alter` hooks. Ordered first by module (weight, name),
   * then — within a module — by the order of hooks/variants supplied.
   *
   * Ports ModuleHandler::getCombinedListeners().
   */
  private getCombinedListeners(hooks: string[]): HookCallback[] {
    interface Entry {
      module: string;
      hookIndex: number;
      seq: number;
      callback: HookCallback;
    }
    const entries: Entry[] = [];
    const seen = new Set<HookCallback>();
    hooks.forEach((hook, hookIndex) => {
      for (const reg of this.getOrderedImplementations(hook)) {
        if (seen.has(reg.callback)) {
          continue; // Don't add the same listener more than once.
        }
        seen.add(reg.callback);
        entries.push({ module: reg.module, hookIndex, seq: reg.seq, callback: reg.callback });
      }
    });
    entries.sort((a, b) => {
      const byModule = this.compareModules(a.module, b.module);
      if (byModule !== 0) return byModule;
      // Within the same module, order by variant index, then registration seq.
      if (a.hookIndex !== b.hookIndex) return a.hookIndex - b.hookIndex;
      return a.seq - b.seq;
    });
    return entries.map((e) => e.callback);
  }

  private compareRegistrations(a: Registration, b: Registration): number {
    const byModule = this.compareModules(a.module, b.module);
    if (byModule !== 0) return byModule;
    return a.seq - b.seq;
  }

  /** Orders modules by ascending weight, then alphabetically by name. */
  private compareModules(a: string, b: string): number {
    const wa = this.moduleList[a]?.weight ?? 0;
    const wb = this.moduleList[b]?.weight ?? 0;
    if (wa !== wb) return wa - wb;
    return a < b ? -1 : a > b ? 1 : 0;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a module machine name from a dependency string.
 * Examples: "user" -> "user", "drupal:node" -> "node",
 *           "drupal:views (>=1.0)" -> "views".
 */
function parseDependencyName(dependency: string): string {
  const afterColon = dependency.includes(':')
    ? dependency.slice(dependency.indexOf(':') + 1)
    : dependency;
  const name = afterColon.trim().split(/[\s(]/, 1)[0];
  return name ?? afterColon.trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  );
}

/**
 * Recursively merges plain-object structures, ported from
 * `Drupal\Component\Utility\NestedArray::mergeDeep`. Later values override
 * earlier scalar values at the same key; nested objects merge recursively.
 */
function mergeDeep(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = mergeDeep(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
