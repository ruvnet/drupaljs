/**
 * @drupaljs/di — Drupal's dependency-injection container, ported to TypeScript.
 *
 * Ports the runtime semantics of
 *   - Drupal\Component\DependencyInjection\Container
 *   - Drupal\Core\DependencyInjection\ContainerBuilder
 * (which themselves extend / mirror the Symfony DI component).
 *
 * Drupal differences preserved here:
 *   - Services are PUBLIC by default (Symfony made them private in 5.2).
 *   - Parameter names MUST be lowercase (ContainerBuilder::setParameter()).
 *   - The builder can be used after compilation; synthetic services are set
 *     on the compiled container at runtime.
 *   - The container refuses to be serialized (__sleep asserts FALSE).
 *
 * TODO(@drupaljs/contracts): once a shared contracts package exists, move
 * ContainerInterface / CompilerPassInterface there and import them.
 */

// ---------------------------------------------------------------------------
// Invalid-reference behavior constants (mirror Symfony's ContainerInterface).
// ---------------------------------------------------------------------------

export const EXCEPTION_ON_INVALID_REFERENCE = 1;
export const NULL_ON_INVALID_REFERENCE = 2;
export const IGNORE_ON_INVALID_REFERENCE = 3;

export type InvalidBehavior =
  | typeof EXCEPTION_ON_INVALID_REFERENCE
  | typeof NULL_ON_INVALID_REFERENCE
  | typeof IGNORE_ON_INVALID_REFERENCE;

// ---------------------------------------------------------------------------
// Exceptions (mirror Symfony\Component\DependencyInjection\Exception\*).
// ---------------------------------------------------------------------------

export class RuntimeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeException';
  }
}

export class InvalidArgumentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArgumentException';
  }
}

export class LogicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LogicException';
  }
}

export class ServiceNotFoundException extends Error {
  constructor(
    public readonly id: string,
    public readonly alternatives: string[] = [],
  ) {
    let message = id
      ? `You have requested a non-existent service "${id}".`
      : 'You have requested an empty service id.';
    if (alternatives.length > 0) {
      message += ` Did you mean one of these: "${alternatives.join('", "')}"?`;
    }
    super(message);
    this.name = 'ServiceNotFoundException';
  }
}

export class ParameterNotFoundException extends Error {
  constructor(
    public readonly key: string,
    public readonly alternatives: string[] = [],
  ) {
    let message = `You have requested a non-existent parameter "${key}".`;
    if (alternatives.length > 0) {
      message += ` Did you mean one of these: "${alternatives.join('", "')}"?`;
    }
    super(message);
    this.name = 'ParameterNotFoundException';
  }
}

export class ServiceCircularReferenceException extends Error {
  constructor(
    public readonly serviceId: string,
    public readonly path: string[],
  ) {
    super(
      `Circular reference detected for service "${serviceId}", path: "${path.join(' -> ')}".`,
    );
    this.name = 'ServiceCircularReferenceException';
  }
}

// ---------------------------------------------------------------------------
// Argument value objects.
// ---------------------------------------------------------------------------

/** A constructable class (the `class` of a Definition). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Newable = new (...args: any[]) => object;

/** A factory callable (the `factory` of a Definition). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FactoryFn = (...args: any[]) => unknown;

/** Tag attributes (`priority`, etc.). */
export type TagAttributes = Record<string, unknown>;

/** A reference to another service, used as an argument value. */
export class Reference {
  constructor(
    public readonly id: string,
    public readonly invalidBehavior: InvalidBehavior = EXCEPTION_ON_INVALID_REFERENCE,
  ) {}
}

/** A reference to a container parameter, used as an argument value. */
export class Parameter {
  constructor(public readonly name: string) {}
}

/**
 * Collects all services tagged with `tag`, ordered by descending `priority`,
 * and injects them as an array argument (Symfony's tagged_iterator).
 */
export class TaggedIteratorArgument {
  constructor(
    public readonly tag: string,
    public readonly indexAttribute?: string,
  ) {}
}

// ---------------------------------------------------------------------------
// Definition.
// ---------------------------------------------------------------------------

export class Definition {
  private serviceClass: Newable | undefined;
  private factory: FactoryFn | undefined;
  private args: unknown[] = [];
  private tags: Map<string, TagAttributes[]> = new Map();
  private shared = true;
  private synthetic = false;
  private servicePublic = true;

  constructor(serviceClass?: Newable) {
    this.serviceClass = serviceClass;
  }

  getClass(): Newable | undefined {
    return this.serviceClass;
  }

  setClass(serviceClass: Newable): this {
    this.serviceClass = serviceClass;
    return this;
  }

  getArguments(): unknown[] {
    return this.args;
  }

  setArguments(args: unknown[]): this {
    this.args = args;
    return this;
  }

  addArgument(arg: unknown): this {
    this.args.push(arg);
    return this;
  }

  getFactory(): FactoryFn | undefined {
    return this.factory;
  }

  setFactory(factory: FactoryFn): this {
    this.factory = factory;
    return this;
  }

  addTag(name: string, attributes: TagAttributes = {}): this {
    const list = this.tags.get(name) ?? [];
    list.push(attributes);
    this.tags.set(name, list);
    return this;
  }

  hasTag(name: string): boolean {
    return this.tags.has(name);
  }

  getTag(name: string): TagAttributes[] {
    return this.tags.get(name) ?? [];
  }

  getTags(): Map<string, TagAttributes[]> {
    return this.tags;
  }

  isShared(): boolean {
    return this.shared;
  }

  setShared(shared: boolean): this {
    this.shared = shared;
    return this;
  }

  isSynthetic(): boolean {
    return this.synthetic;
  }

  setSynthetic(synthetic: boolean): this {
    this.synthetic = synthetic;
    return this;
  }

  isPublic(): boolean {
    return this.servicePublic;
  }

  setPublic(servicePublic: boolean): this {
    this.servicePublic = servicePublic;
    return this;
  }
}

// ---------------------------------------------------------------------------
// Compiler pass contract.
// ---------------------------------------------------------------------------

export interface CompilerPassInterface {
  process(container: ContainerBuilder): void;
}

// ---------------------------------------------------------------------------
// Container interface (Drupal\Component\DependencyInjection\ContainerInterface).
// ---------------------------------------------------------------------------

export interface ContainerInterface {
  get<T = object>(id: string, invalidBehavior?: InvalidBehavior): T | null;
  set(id: string, service: object | null): void;
  has(id: string): boolean;
  initialized(id: string): boolean;
  getParameter(name: string): unknown;
  hasParameter(name: string): boolean;
  getServiceIds(): string[];
}

// ---------------------------------------------------------------------------
// Levenshtein-based "did you mean" alternatives (ports Container::getAlternatives).
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]!;
  }
  return prev[n]!;
}

function getAlternatives(searchKey: string, keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    if (levenshtein(searchKey, key) <= searchKey.length / 3 || key.includes(searchKey)) {
      out.push(key);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Compiled definition snapshot passed from the builder to the container.
// ---------------------------------------------------------------------------

interface ContainerDefinition {
  aliases: Record<string, string>;
  parameters: Record<string, unknown>;
  definitions: Map<string, Definition>;
  /** tag name -> ordered service ids (descending priority). */
  taggedServiceIds: Map<string, string[]>;
}

// ---------------------------------------------------------------------------
// Container — the compiled, runtime container.
// ---------------------------------------------------------------------------

export class Container implements ContainerInterface {
  private readonly aliases: Record<string, string>;
  private readonly parameters: Record<string, unknown>;
  private readonly definitions: Map<string, Definition>;
  private readonly taggedServiceIds: Map<string, string[]>;
  private readonly services: Map<string, object | null> = new Map();
  private readonly loading: Set<string> = new Set();

  constructor(definition: ContainerDefinition) {
    this.aliases = definition.aliases;
    this.parameters = definition.parameters;
    this.definitions = definition.definitions;
    this.taggedServiceIds = definition.taggedServiceIds;
  }

  get<T = object>(
    id: string,
    invalidBehavior: InvalidBehavior = EXCEPTION_ON_INVALID_REFERENCE,
  ): T | null {
    if (this.aliases[id] !== undefined) {
      id = this.aliases[id]!;
    }

    // Re-use shared instance (NULL_ON_INVALID_REFERENCE also honors cached null).
    if (
      this.services.has(id) &&
      (this.services.get(id) !== undefined || invalidBehavior === NULL_ON_INVALID_REFERENCE)
    ) {
      return this.services.get(id) as T | null;
    }

    if (id === 'service_container') {
      return this as unknown as T;
    }

    if (this.loading.has(id)) {
      throw new ServiceCircularReferenceException(id, [...this.loading]);
    }

    const definition = this.definitions.get(id);

    if (!definition) {
      if (invalidBehavior === EXCEPTION_ON_INVALID_REFERENCE) {
        throw new ServiceNotFoundException(id, this.getServiceAlternatives(id));
      }
      return null;
    }

    this.loading.add(id);
    let service: object | null;
    try {
      service = this.createService(definition, id);
    } catch (e) {
      this.loading.delete(id);
      this.services.delete(id);
      if (invalidBehavior !== EXCEPTION_ON_INVALID_REFERENCE) {
        return null;
      }
      throw e;
    }
    this.loading.delete(id);

    return service as T | null;
  }

  set(id: string, service: object | null): void {
    if (this.aliases[id] !== undefined) {
      id = this.aliases[id]!;
    }
    this.services.set(id, service);
  }

  has(id: string): boolean {
    return (
      this.aliases[id] !== undefined ||
      this.services.has(id) ||
      this.definitions.has(id) ||
      id === 'service_container'
    );
  }

  initialized(id: string): boolean {
    if (this.aliases[id] !== undefined) {
      id = this.aliases[id]!;
    }
    return this.services.has(id);
  }

  getParameter(name: string): unknown {
    if (!Object.prototype.hasOwnProperty.call(this.parameters, name)) {
      throw new ParameterNotFoundException(name, this.getParameterAlternatives(name));
    }
    return this.parameters[name];
  }

  hasParameter(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.parameters, name);
  }

  getServiceIds(): string[] {
    return [
      'service_container',
      ...new Set([...this.definitions.keys(), ...this.services.keys()]),
    ];
  }

  /** Releases shared instances for ref-counting (Container::reset()). */
  reset(): void {
    this.services.clear();
  }

  /** Serialization guard — ports Container::__sleep() asserting FALSE. */
  toJSON(): never {
    throw new RuntimeException('The container was serialized.');
  }

  private createService(definition: Definition, id: string): object {
    if (definition.isSynthetic()) {
      throw new RuntimeException(
        `You have requested a synthetic service ("${id}"). The service container does not know how to construct this service. The service will need to be set before it is first used.`,
      );
    }

    const args = this.resolveArguments(definition.getArguments());

    let service: object;
    const factory = definition.getFactory();
    if (factory) {
      service = factory(...args) as object;
    } else {
      const serviceClass = definition.getClass();
      if (!serviceClass) {
        throw new RuntimeException(
          `Cannot create service "${id}": no class or factory was defined.`,
        );
      }
      service = new serviceClass(...args);
    }

    if (definition.isShared()) {
      this.services.set(id, service);
    }

    return service;
  }

  private resolveArguments(args: unknown[]): unknown[] {
    return args.map((arg) => this.resolveValue(arg));
  }

  private resolveValue(value: unknown): unknown {
    if (value instanceof Reference) {
      return this.get(value.id, value.invalidBehavior);
    }
    if (value instanceof Parameter) {
      return this.getParameter(value.name);
    }
    if (value instanceof TaggedIteratorArgument) {
      const ids = this.taggedServiceIds.get(value.tag) ?? [];
      return ids.map((serviceId) => this.get(serviceId));
    }
    if (typeof value === 'string') {
      return this.resolveString(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.resolveValue(v));
    }
    return value;
  }

  /**
   * Resolves `%param%` placeholders. A bare `%name%` returns the raw parameter
   * value (any type); embedded placeholders are stringified. `%%` escapes a
   * literal percent sign (Symfony ParameterBag semantics).
   */
  private resolveString(value: string): unknown {
    // Whole-string single parameter -> return raw typed value.
    const whole = /^%([^%\s]+)%$/.exec(value);
    if (whole) {
      return this.getParameter(whole[1]!);
    }
    if (!value.includes('%')) {
      return value;
    }
    return value.replace(/%%|%([^%\s]+)%/g, (match, name?: string) => {
      if (match === '%%') return '%';
      return String(this.getParameter(name!));
    });
  }

  private getServiceAlternatives(id: string): string[] {
    const keys = [...new Set([...this.services.keys(), ...this.definitions.keys()])];
    return getAlternatives(id, keys);
  }

  private getParameterAlternatives(name: string): string[] {
    return getAlternatives(name, Object.keys(this.parameters));
  }
}

// ---------------------------------------------------------------------------
// ContainerBuilder — registers definitions, runs compiler passes, compiles.
// ---------------------------------------------------------------------------

export class ContainerBuilder {
  private readonly definitions: Map<string, Definition> = new Map();
  private readonly aliases: Map<string, string> = new Map();
  private readonly parameters: Map<string, unknown> = new Map();
  private readonly compilerPasses: CompilerPassInterface[] = [];
  private compiled = false;

  /** Register a service. Drupal services are public by default. */
  register(id: string, serviceClass?: Newable): Definition {
    const definition = new Definition(serviceClass).setPublic(true);
    this.definitions.set(id, definition);
    return definition;
  }

  setDefinition(id: string, definition: Definition): Definition {
    this.definitions.set(id, definition);
    return definition;
  }

  getDefinition(id: string): Definition {
    const def = this.definitions.get(id);
    if (!def) {
      throw new ServiceNotFoundException(id);
    }
    return def;
  }

  hasDefinition(id: string): boolean {
    return this.definitions.has(id);
  }

  removeDefinition(id: string): void {
    this.definitions.delete(id);
  }

  getDefinitions(): Map<string, Definition> {
    return this.definitions;
  }

  /** Drupal aliases are public by default. */
  setAlias(alias: string, id: string): void {
    this.aliases.set(alias, id);
  }

  hasAlias(alias: string): boolean {
    return this.aliases.has(alias);
  }

  /** Parameter names must be lowercase (ContainerBuilder::setParameter). */
  setParameter(name: string, value: unknown): void {
    if (name.toLowerCase() !== name) {
      throw new InvalidArgumentException(`Parameter names must be lowercase: ${name}`);
    }
    this.parameters.set(name, value);
  }

  getParameter(name: string): unknown {
    if (!this.parameters.has(name)) {
      throw new ParameterNotFoundException(name);
    }
    return this.parameters.get(name);
  }

  hasParameter(name: string): boolean {
    return this.parameters.has(name);
  }

  addCompilerPass(pass: CompilerPassInterface): this {
    this.compilerPasses.push(pass);
    return this;
  }

  isCompiled(): boolean {
    return this.compiled;
  }

  /**
   * Returns `{ serviceId: TagAttributes[] }` for every service tagged `name`
   * (ports ContainerBuilder::findTaggedServiceIds()).
   */
  findTaggedServiceIds(name: string): Record<string, TagAttributes[]> {
    const out: Record<string, TagAttributes[]> = {};
    for (const [id, def] of this.definitions) {
      if (def.hasTag(name)) {
        out[id] = def.getTag(name);
      }
    }
    return out;
  }

  /** Runs compiler passes, then produces the runtime Container. */
  compile(): Container {
    for (const pass of this.compilerPasses) {
      pass.process(this);
    }
    this.compiled = true;

    const taggedServiceIds = this.buildTaggedServiceIndex();

    return new Container({
      aliases: Object.fromEntries(this.aliases),
      parameters: Object.fromEntries(this.parameters),
      definitions: this.definitions,
      taggedServiceIds,
    });
  }

  /** Pre-orders every tag's services by descending priority for tagged_iterator. */
  private buildTaggedServiceIndex(): Map<string, string[]> {
    const index = new Map<string, { id: string; priority: number }[]>();
    for (const [id, def] of this.definitions) {
      for (const [tag, attrsList] of def.getTags()) {
        const list = index.get(tag) ?? [];
        for (const attrs of attrsList) {
          const priority = typeof attrs.priority === 'number' ? attrs.priority : 0;
          list.push({ id, priority });
        }
        index.set(tag, list);
      }
    }
    const ordered = new Map<string, string[]>();
    for (const [tag, list] of index) {
      // Stable sort by descending priority (Symfony PriorityTaggedServiceTrait).
      list.sort((a, b) => b.priority - a.priority);
      ordered.set(
        tag,
        list.map((e) => e.id),
      );
    }
    return ordered;
  }
}
