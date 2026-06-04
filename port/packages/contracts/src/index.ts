/**
 * @drupaljs/contracts — shared interfaces and types for the Drupal.js port.
 * Grounded in Drupal 11 core (drupal-core/core/lib/Drupal/Core/).
 * All other packages import from here; never import implementation details.
 */

// ---------------------------------------------------------------------------
// DI / Service Container
//
// Canonical shape — mirrors the runtime container in `@drupaljs/di`
// (Drupal\Component\DependencyInjection\ContainerInterface, which itself
// mirrors Symfony's). Drupal differences preserved: services are PUBLIC by
// default, `get()` returns `null` (not a throw) under non-exception invalid
// behavior, and the container exposes parameters + service ids.
// ---------------------------------------------------------------------------

/** Invalid-reference behavior constants (mirror Symfony's ContainerInterface). */
export const EXCEPTION_ON_INVALID_REFERENCE = 1 as const;
export const NULL_ON_INVALID_REFERENCE = 2 as const;
export const IGNORE_ON_INVALID_REFERENCE = 3 as const;

export type InvalidBehavior =
  | typeof EXCEPTION_ON_INVALID_REFERENCE
  | typeof NULL_ON_INVALID_REFERENCE
  | typeof IGNORE_ON_INVALID_REFERENCE;

export interface ContainerInterface {
  /**
   * Returns a service. On a miss, throws under `EXCEPTION_ON_INVALID_REFERENCE`
   * (the default) and returns `null` otherwise.
   */
  get<T = object>(id: string, invalidBehavior?: InvalidBehavior): T | null;
  set(id: string, service: object | null): void;
  has(id: string): boolean;
  initialized(id: string): boolean;
  getParameter(name: string): unknown;
  hasParameter(name: string): boolean;
  getServiceIds(): string[];
}

/**
 * A serializable description of a service, mirroring the public surface of
 * `@drupaljs/di`'s `Definition` class (class / factory / arguments / tags /
 * shared / synthetic / public). Arguments use Drupal/Symfony reference syntax
 * (`@service`, `%parameter%`) when expressed as strings.
 */
export interface ServiceDefinition {
  readonly class?: new (...args: unknown[]) => unknown;
  readonly factory?: (...args: unknown[]) => unknown;
  readonly arguments?: unknown[];
  readonly tags?: string[];
  readonly shared?: boolean;
  readonly synthetic?: boolean;
  readonly public?: boolean;
}

// ---------------------------------------------------------------------------
// Event Dispatcher
// ---------------------------------------------------------------------------

export interface EventInterface {
  readonly name: string;
  isPropagationStopped(): boolean;
  stopPropagation(): void;
}

export interface EventDispatcherInterface {
  dispatch<T extends EventInterface>(event: T): T;
  addListener(eventName: string, listener: EventListenerFn, priority?: number): void;
  removeListener(eventName: string, listener: EventListenerFn): void;
  hasListeners(eventName?: string): boolean;
  getListeners(eventName?: string): EventListenerFn[];
}

export type EventListenerFn = (event: EventInterface) => void;

export interface EventSubscriberInterface {
  getSubscribedEvents(): Record<string, string | [string, number?] | Array<[string, number?]>>;
}

// ---------------------------------------------------------------------------
// Module Hook System
// ---------------------------------------------------------------------------

export interface ModuleHandlerInterface {
  invoke(hook: string, ...args: unknown[]): void;
  invokeAll(hook: string, ...args: unknown[]): unknown[];
  invokeAllWith(hook: string, context: Record<string, unknown>, ...args: unknown[]): unknown[];
  alter(type: string, data: unknown, ...context: unknown[]): void;
  getImplementations(hook: string): HookImplementation[];
  implementsHook(module: string, hook: string): boolean;
}

export interface HookImplementation {
  readonly module: string;
  readonly hook: string;
  readonly callable: (...args: unknown[]) => unknown;
}

// ---------------------------------------------------------------------------
// Plugin System
// ---------------------------------------------------------------------------

export interface PluginInterface {
  getPluginId(): string;
  getPluginDefinition(): PluginDefinition;
}

export type PluginDefinition = {
  readonly id: string;
  readonly label?: string;
  readonly description?: string;
  readonly class?: string;
  readonly provider?: string;
  readonly [key: string]: unknown;
};

export interface PluginManagerInterface<T extends PluginInterface = PluginInterface> {
  createInstance(pluginId: string, configuration?: Record<string, unknown>): T;
  getDefinition(pluginId: string): PluginDefinition | undefined;
  getDefinitions(): Record<string, PluginDefinition>;
  hasDefinition(pluginId: string): boolean;
}

export interface PluginFactoryInterface<T extends PluginInterface = PluginInterface> {
  createInstance(definition: PluginDefinition, configuration?: Record<string, unknown>): T;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ConfigInterface {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): this;
  clear(key: string): this;
  delete(): void;
  save(): void;
  getName(): string;
  getRawData(): Record<string, unknown>;
  isNew(): boolean;
}

export interface ImmutableConfig {
  get<T = unknown>(key: string): T | undefined;
  getName(): string;
  getRawData(): Record<string, unknown>;
}

export interface ConfigFactoryInterface {
  get(name: string): ImmutableConfig;
  getEditable(name: string): ConfigInterface;
  listAll(prefix?: string): string[];
  reset(name?: string): void;
}

export interface ConfigStorageInterface {
  read(name: string): Record<string, unknown> | false;
  readMultiple(names: string[]): Record<string, Record<string, unknown>>;
  write(name: string, data: Record<string, unknown>): boolean;
  delete(name: string): boolean;
  rename(name: string, newName: string): boolean;
  listAll(prefix?: string): string[];
  deleteAll(prefix?: string): boolean;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export const CACHE_PERMANENT = -1 as const;
export const CACHE_NOT_PERMANENT = 0 as const;

/**
 * A single cache item as returned by `get()` / `getMultiple()`.
 *
 * Canonical shape — matches `@drupaljs/cache`. `created` and `valid` are
 * required (the backend always populates them); `data` is the deserialized
 * payload. There is no `checksum` field on the item — tag-checksum validity is
 * computed via {@link CacheTagsChecksumInterface}.
 */
export interface CacheItem<T = unknown> {
  /** The cache ID. */
  cid: string;
  /** The cached payload (deserialized). */
  data: T;
  /** Creation time, in Unix seconds (fractional allowed). */
  created: number;
  /** Expiry: `CACHE_PERMANENT` or a Unix timestamp (seconds). */
  expire: number;
  /** Sorted, de-duplicated list of cache tags. */
  tags: string[];
  /** Whether the item is still valid (not expired/invalidated). */
  valid: boolean;
}

/**
 * The shape of an item accepted by `setMultiple()`, keyed by cache ID.
 *
 * Mirrors the associative array Drupal accepts:
 * `['data' => ..., 'expire' => ..., 'tags' => []]`.
 */
export interface CacheSetItem<T = unknown> {
  /** Required payload to store. */
  data: T;
  /** Optional expiry; defaults to `CACHE_PERMANENT`. */
  expire?: number;
  /** Optional cache tags for this item. */
  tags?: string[];
}

/**
 * Canonical cache backend contract — matches `@drupaljs/cache`'s
 * Drupal-11-faithful `CacheBackendInterface`:
 *  - `get`/`getMultiple` accept `allowInvalid`,
 *  - `setMultiple` is keyed by cache ID (`Record<string, CacheSetItem>`),
 *  - exposes `removeBin()`,
 *  - no deprecated `invalidateAll()`.
 */
export interface CacheBackendInterface {
  get<T = unknown>(cid: string, allowInvalid?: boolean): CacheItem<T> | false;
  getMultiple<T = unknown>(
    cids: string[],
    allowInvalid?: boolean,
  ): Record<string, CacheItem<T>>;
  set(cid: string, data: unknown, expire?: number, tags?: string[]): void;
  setMultiple(items: Record<string, CacheSetItem>): void;
  delete(cid: string): void;
  deleteMultiple(cids: string[]): void;
  deleteAll(): void;
  invalidate(cid: string): void;
  invalidateMultiple(cids: string[]): void;
  invalidateTags(tags: string[]): void;
  garbageCollection(): void;
  /** Removes the entire bin. */
  removeBin(): void;
}

export interface CacheTagsInvalidatorInterface {
  invalidateTags(tags: string[]): void;
}

/**
 * Canonical tag-checksum contract — matches `@drupaljs/cache`'s
 * `ChecksumProvider`. Checksums are **integers** (summed per-tag invalidation
 * counts), and the provider is itself a tag invalidator (it bumps counters).
 */
export interface CacheTagsChecksumInterface extends CacheTagsInvalidatorInterface {
  getCurrentChecksum(tags: string[]): number;
  isValid(checksum: number, tags: string[]): boolean;
  reset(): void;
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export interface RouteInterface {
  getPath(): string;
  getMethods(): string[];
  getRequirements(): Record<string, string>;
  getDefaults(): Record<string, unknown>;
  getOptions(): Record<string, unknown>;
  compile(): CompiledRoute;
}

export interface CompiledRoute {
  readonly regex: string;
  readonly variables: string[];
  readonly tokens: RouteToken[];
  readonly staticPrefix: string;
}

export type RouteToken = { type: 'text'; text: string } | { type: 'variable'; name: string; regex: string };

export interface RouteProviderInterface {
  getRouteByName(name: string): RouteInterface | undefined;
  getRoutesByPattern(pattern: string): RouteInterface[];
  getAllRoutes(): Map<string, RouteInterface>;
}

/**
 * The resolved route for the current request.
 * Mirrors `Drupal\Core\Routing\RouteMatchInterface` — distinct from the
 * provider (lookup) above; this represents *what matched*.
 */
export interface RouteMatchInterface {
  getRouteName(): string | undefined;
  getRouteObject(): RouteInterface | undefined;
  getParameter<T = unknown>(name: string): T | undefined;
  getParameters(): Map<string, unknown>;
  getRawParameter(name: string): string | undefined;
  getRawParameters(): Map<string, string>;
}

export interface UrlGeneratorInterface {
  generate(name: string, parameters?: Record<string, unknown>, options?: UrlGeneratorOptions): string;
  generateFromRoute(route: RouteInterface, parameters?: Record<string, unknown>, options?: UrlGeneratorOptions): string;
}

export interface UrlGeneratorOptions {
  absolute?: boolean;
  fragment?: string;
  query?: Record<string, string>;
  language?: LanguageInterface;
}

// ---------------------------------------------------------------------------
// HTTP Kernel
// ---------------------------------------------------------------------------

export interface RequestInterface {
  readonly method: string;
  readonly path: string;
  readonly query: Record<string, string>;
  readonly headers: Record<string, string>;
  readonly body: unknown;
  getAttribute<T = unknown>(name: string): T | undefined;
  setAttribute(name: string, value: unknown): void;
}

export interface ResponseInterface {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export interface MiddlewareInterface {
  handle(request: RequestInterface, next: (req: RequestInterface) => ResponseInterface): ResponseInterface;
}

export interface ControllerResolverInterface {
  getController(request: RequestInterface): ControllerCallable | false;
}

export type ControllerCallable = (request: RequestInterface, ...args: unknown[]) => ResponseInterface;

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

export interface EntityInterface {
  id(): string | number | undefined;
  uuid(): string;
  label(): string;
  bundle(): string;
  getEntityTypeId(): string;
  isNew(): boolean;
  save(): number;
  delete(): void;
  toArray(): Record<string, unknown>;
  hasField(fieldName: string): boolean;
  get(fieldName: string): FieldItemListInterface;
  set(fieldName: string, value: unknown): this;
}

export interface ContentEntityInterface extends EntityInterface {
  getRevisionId(): number | undefined;
  isNewRevision(): boolean;
  setNewRevision(value: boolean): void;
  getTranslation(langcode: string): ContentEntityInterface;
  hasTranslation(langcode: string): boolean;
  language(): LanguageInterface;
}

export interface EntityTypeInterface {
  id(): string;
  label(): string;
  getBaseTable(): string;
  getDataTable(): string | undefined;
  getRevisionTable(): string | undefined;
  getClass(): string;
  getStorageClass(): string;
  entityClassImplements(interfaceName: string): boolean;
  getKeys(): Record<string, string>;
  getKey(key: string): string | undefined;
  hasKey(key: string): boolean;
  getLinks(): Record<string, string>;
}

export interface EntityStorageInterface<T extends EntityInterface = EntityInterface> {
  load(id: string | number): T | undefined;
  loadMultiple(ids?: Array<string | number>): Record<string | number, T>;
  loadByProperties(values: Record<string, unknown>): Record<string | number, T>;
  save(entity: T): number;
  delete(entities: T[]): void;
  create(values?: Record<string, unknown>): T;
  getQuery(): EntityQueryInterface;
}

export interface EntityQueryInterface {
  condition(field: string, value: unknown, operator?: string): this;
  sort(field: string, direction?: 'ASC' | 'DESC'): this;
  range(start?: number, length?: number): this;
  count(): this;
  execute(): Promise<Array<string | number> | number>;
  accessCheck(accessCheck?: boolean): this;
  addTag(tag: string): this;
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

export interface FieldDefinitionInterface {
  getName(): string;
  getType(): string;
  getLabel(): string;
  isRequired(): boolean;
  isMultiple(): boolean;
  getCardinality(): number;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  getTargetEntityTypeId(): string;
  getTargetBundle(): string | undefined;
}

export interface FieldItemInterface {
  getValue(): Record<string, unknown>;
  setValue(values: unknown): void;
  getFieldDefinition(): FieldDefinitionInterface;
  isEmpty(): boolean;
}

export interface FieldItemListInterface {
  getValue(): Array<Record<string, unknown>>;
  setValue(values: unknown): void;
  getString(): string;
  isEmpty(): boolean;
  getFieldDefinition(): FieldDefinitionInterface;
  first(): FieldItemInterface | undefined;
  count(): number;
  [Symbol.iterator](): Iterator<FieldItemInterface>;
}

// ---------------------------------------------------------------------------
// Typed Data
// ---------------------------------------------------------------------------

export interface DataDefinitionInterface {
  getDataType(): string;
  getLabel(): string | undefined;
  getDescription(): string | undefined;
  isReadOnly(): boolean;
  isComputed(): boolean;
  isRequired(): boolean;
  getConstraints(): Record<string, unknown>;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
}

export interface TypedDataInterface {
  getValue(): unknown;
  setValue(value: unknown, notify?: boolean): void;
  getString(): string;
  validate(): ConstraintViolationListInterface;
  getDataDefinition(): DataDefinitionInterface;
  getName(): string | undefined;
  getRoot(): TypedDataInterface;
  getPropertyPath(): string;
  getParent(): TypedDataInterface | undefined;
}

export interface ComplexDataInterface extends TypedDataInterface {
  get(property_name: string): TypedDataInterface | undefined;
  set(property_name: string, value: unknown): this;
  getProperties(include_computed?: boolean): Record<string, TypedDataInterface>;
}

export interface ListDataDefinitionInterface extends DataDefinitionInterface {
  getItemDefinition(): DataDefinitionInterface;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationConstraintInterface {
  readonly name: string;
  readonly options: Record<string, unknown>;
}

export interface ConstraintViolationInterface {
  readonly message: string;
  readonly propertyPath: string;
  readonly invalidValue: unknown;
  readonly code?: string;
}

export interface ConstraintViolationListInterface {
  count(): number;
  [Symbol.iterator](): Iterator<ConstraintViolationInterface>;
  add(violation: ConstraintViolationInterface): void;
  get(offset: number): ConstraintViolationInterface | undefined;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export type RenderArray = {
  '#type'?: string;
  '#theme'?: string;
  '#markup'?: string;
  '#plain_text'?: string;
  '#attached'?: AttachedAssets;
  '#cache'?: CacheMetadata;
  '#prefix'?: string;
  '#suffix'?: string;
  '#weight'?: number;
  '#access'?: boolean | AccessResultInterface;
  '#pre_render'?: Array<RenderCallable>;
  '#post_render'?: Array<RenderCallable>;
  '#children'?: string;
  [key: string]: unknown;
};

export type RenderCallable = (element: RenderArray) => RenderArray;

export interface AttachedAssets {
  library?: string[];
  drupalSettings?: Record<string, unknown>;
  html_head?: Array<[Record<string, unknown>, string]>;
  html_head_link?: Array<Record<string, unknown>>;
}

export interface CacheMetadata {
  contexts?: string[];
  tags?: string[];
  max_age?: number;
}

export interface BubbleableMetadataInterface {
  getCacheContexts(): string[];
  getCacheTags(): string[];
  getCacheMaxAge(): number;
  addCacheContexts(cacheContexts: string[]): this;
  addCacheTags(cacheTags: string[]): this;
  mergeCacheMaxAge(maxAge: number): this;
  merge(other: BubbleableMetadataInterface): this;
}

export interface RendererInterface {
  render(elements: RenderArray): string;
  renderRoot(elements: RenderArray): string;
  renderPlain(elements: RenderArray): string;
  mergeBubbleableMetadata(elements: RenderArray, metadata: BubbleableMetadataInterface): void;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface ThemeManagerInterface {
  render(hook: string, variables: Record<string, unknown>): string;
  getActiveTheme(): ActiveTheme;
}

export interface ThemeNegotiatorInterface {
  applies(request: RequestInterface): boolean;
  determineActiveTheme(request: RequestInterface): string | undefined;
}

export interface ActiveTheme {
  readonly name: string;
  readonly path: string;
  readonly logo: string;
  readonly libraries: string[];
  readonly libraries_override: Record<string, unknown>;
  readonly libraries_extend: Record<string, unknown>;
  readonly regions: string[];
  readonly baseThemeExtensions: Record<string, ActiveTheme>;
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export interface AccessResultInterface {
  isAllowed(): boolean;
  isForbidden(): boolean;
  isNeutral(): boolean;
  andIf(other: AccessResultInterface): AccessResultInterface;
  orIf(other: AccessResultInterface): AccessResultInterface;
  addCacheContexts(cacheContexts: string[]): this;
  addCacheTags(cacheTags: string[]): this;
  setCacheMaxAge(maxAge: number): this;
}

export interface AccessManagerInterface {
  checkNamedRoute(routeName: string, parameters?: Record<string, unknown>): AccessResultInterface;
  check(route: RouteInterface, request: RequestInterface): AccessResultInterface;
}

// ---------------------------------------------------------------------------
// Form API
// ---------------------------------------------------------------------------

export type FormElement = RenderArray & {
  '#type': string;
  '#default_value'?: unknown;
  '#required'?: boolean;
  '#title'?: string;
  '#description'?: string;
  '#options'?: Record<string, string>;
  '#size'?: number;
  '#maxlength'?: number;
  '#element_validate'?: Array<FormValidateCallable>;
  '#submit'?: Array<FormSubmitCallable>;
};

export type FormValidateCallable = (element: FormElement, formState: FormStateInterface) => void;
export type FormSubmitCallable = (form: FormElement, formState: FormStateInterface) => void;

export interface FormStateInterface {
  getValues(): Record<string, unknown>;
  getValue(key: string): unknown;
  setValue(key: string, value: unknown): void;
  setError(element: FormElement, message: string): void;
  getErrors(): Record<string, string>;
  hasAnyErrors(): boolean;
  isSubmitted(): boolean;
  setSubmitted(): void;
  getRedirect(): string | undefined;
  setRedirect(route: string, parameters?: Record<string, unknown>): void;
  setRebuild(rebuild?: boolean): void;
  isRebuilding(): boolean;
  getTriggeringElement(): FormElement | undefined;
}

export interface FormInterface {
  getFormId(): string;
  buildForm(form: FormElement, formState: FormStateInterface): FormElement;
  validateForm(form: FormElement, formState: FormStateInterface): void;
  submitForm(form: FormElement, formState: FormStateInterface): void;
}

// ---------------------------------------------------------------------------
// Logger (PSR-3 compatible)
// ---------------------------------------------------------------------------

export type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

export interface LoggerInterface {
  emergency(message: string, context?: Record<string, unknown>): void;
  alert(message: string, context?: Record<string, unknown>): void;
  critical(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warning(message: string, context?: Record<string, unknown>): void;
  notice(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
}

export interface LoggerChannelInterface extends LoggerInterface {
  addLogger(logger: LoggerInterface, priority?: number): void;
}

export interface LoggerChannelFactoryInterface {
  get(channel: string): LoggerChannelInterface;
  addLogger(logger: LoggerInterface, priority?: number): void;
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export interface QueueInterface {
  createItem(data: unknown): string | number | false;
  numberOfItems(): number;
  claimItem(leaseTime?: number): QueueItem | false;
  deleteItem(item: QueueItem): void;
  releaseItem(item: QueueItem): boolean;
  createQueue(): void;
  deleteQueue(): void;
}

export interface QueueItem {
  readonly item_id: string | number;
  readonly data: unknown;
  readonly created: number;
  readonly expire?: number;
}

export interface QueueWorkerInterface {
  processItem(data: unknown): void;
}

// ---------------------------------------------------------------------------
// Lock
// ---------------------------------------------------------------------------

export interface LockBackendInterface {
  acquire(name: string, timeout?: number): boolean;
  lockMayBeAvailable(name: string): boolean;
  release(name: string): void;
  releaseAll(lockId?: string): void;
  wait(name: string, delay?: number): boolean;
  getLockId(): string;
}

// ---------------------------------------------------------------------------
// State / Key-Value Store
// ---------------------------------------------------------------------------

export interface StateInterface {
  get<T = unknown>(key: string): T | undefined;
  getMultiple(keys: string[]): Record<string, unknown>;
  set(key: string, value: unknown): void;
  setMultiple(data: Record<string, unknown>): void;
  delete(key: string): void;
  deleteMultiple(keys: string[]): void;
  resetCache(): void;
}

export interface KeyValueStoreInterface {
  get<T = unknown>(key: string): T | undefined;
  getMultiple<T = unknown>(keys: string[]): Record<string, T>;
  getAll<T = unknown>(): Record<string, T>;
  set(key: string, value: unknown): void;
  setMany(data: Record<string, unknown>): void;
  setIfNotExists(key: string, value: unknown): boolean;
  rename(key: string, newKey: string): void;
  delete(key: string): void;
  deleteMultiple(keys: string[]): void;
  deleteAll(): void;
}

export interface KeyValueFactoryInterface {
  get(collection: string): KeyValueStoreInterface;
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export interface LanguageInterface {
  getId(): string;
  getName(): string;
  getDirection(): 'ltr' | 'rtl';
  isDefault(): boolean;
  isLocked(): boolean;
  getWeight(): number;
}

export interface LanguageManagerInterface {
  getDefaultLanguage(): LanguageInterface;
  getCurrentLanguage(): LanguageInterface;
  getLanguages(): Record<string, LanguageInterface>;
  getLanguage(langcode: string): LanguageInterface | undefined;
  isMultilingual(): boolean;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export interface NormalizerInterface {
  normalize(data: unknown, format?: string, context?: Record<string, unknown>): unknown;
  supportsNormalization(data: unknown, format?: string): boolean;
}

export interface DenormalizerInterface {
  denormalize(data: unknown, type: string, format?: string, context?: Record<string, unknown>): unknown;
  supportsDenormalization(data: unknown, type: string, format?: string): boolean;
}

export interface SerializerInterface {
  serialize(data: unknown, format: string, context?: Record<string, unknown>): string;
  deserialize<T = unknown>(data: string, type: string, format: string, context?: Record<string, unknown>): T;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export interface ConnectionInterface {
  select(table: string, alias?: string): SelectQueryInterface;
  insert(table: string): InsertQueryInterface;
  update(table: string): UpdateQueryInterface;
  delete(table: string): DeleteQueryInterface;
  query<T = unknown>(sql: string, args?: unknown[]): Promise<T[]>;
  transaction(): TransactionInterface;
  schema(): SchemaInterface;
}

export interface SelectQueryInterface {
  fields(table: string, fields?: string[]): this;
  condition(field: string, value: unknown, operator?: string): this;
  orderBy(field: string, direction?: 'ASC' | 'DESC'): this;
  range(start?: number, length?: number): this;
  execute(): Promise<Array<Record<string, unknown>>>;
  countQuery(): Promise<number>;
}

export interface InsertQueryInterface {
  fields(fields: Record<string, unknown>): this;
  values(record: Record<string, unknown>): this;
  execute(): Promise<string | number>;
}

export interface UpdateQueryInterface {
  fields(fields: Record<string, unknown>): this;
  condition(field: string, value: unknown, operator?: string): this;
  execute(): Promise<number>;
}

export interface DeleteQueryInterface {
  condition(field: string, value: unknown, operator?: string): this;
  execute(): Promise<number>;
}

export interface TransactionInterface {
  commit(): void;
  rollBack(): void;
}

export interface SchemaInterface {
  createTable(name: string, schema: TableSchema): void;
  dropTable(name: string): boolean;
  tableExists(table: string): boolean;
  fieldExists(table: string, field: string): boolean;
  addField(table: string, field: string, spec: FieldSchema): void;
  dropField(table: string, field: string): boolean;
  addIndex(table: string, name: string, fields: string[]): void;
  dropIndex(table: string, name: string): boolean;
  addUniqueKey(table: string, name: string, fields: string[]): void;
  dropUniqueKey(table: string, name: string): boolean;
  addPrimaryKey(table: string, fields: string[]): void;
  dropPrimaryKey(table: string): void;
}

export interface TableSchema {
  readonly description?: string;
  readonly fields: Record<string, FieldSchema>;
  readonly primary_key?: string[];
  readonly unique_keys?: Record<string, string[]>;
  readonly indexes?: Record<string, string[]>;
}

export interface FieldSchema {
  readonly type: 'int' | 'bigint' | 'float' | 'numeric' | 'varchar' | 'text' | 'blob' | 'serial';
  readonly length?: number;
  readonly unsigned?: boolean;
  readonly not_null?: boolean;
  readonly default?: unknown;
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// Mail
// ---------------------------------------------------------------------------

export interface MailInterface {
  format(message: MailMessage): MailMessage;
  mail(message: MailMessage): boolean;
}

export interface MailMessage {
  id: string;
  module: string;
  key: string;
  to: string;
  from?: string;
  reply_to?: string;
  langcode: string;
  subject: string;
  body: string[];
  headers: Record<string, string>;
  params: Record<string, unknown>;
  send?: boolean;
}

export interface MailManagerInterface {
  getInstance(module: string): MailInterface;
  mail(module: string, key: string, to: string, langcode: string, params?: Record<string, unknown>, replyTo?: string, send?: boolean): MailMessage;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionInterface {
  start(): boolean;
  get<T = unknown>(attribute: string): T | undefined;
  set(attribute: string, value: unknown): void;
  has(attribute: string): boolean;
  remove(attribute: string): void;
  clear(): void;
  isStarted(): boolean;
  getId(): string;
  setId(id: string): void;
  getName(): string;
  setName(name: string): void;
  save(): void;
  invalidate(lifetime?: number): boolean;
  migrate(destroy?: boolean, lifetime?: number): boolean;
}

// ---------------------------------------------------------------------------
// File System
// ---------------------------------------------------------------------------

export interface FileSystemInterface {
  realpath(path: string): string | false;
  basename(uri: string, suffix?: string): string;
  dirname(uri: string): string;
  tempnam(directory: string, prefix: string): string | false;
  move(source: string, destination: string, replace?: FileExistsAction): string | false;
  copy(source: string, destination: string, replace?: FileExistsAction): string | false;
  delete(path: string): void;
  deleteRecursive(path: string): void;
  prepareDirectory(directory: string, options?: number): boolean;
  mkdir(uri: string, mode?: number, recursive?: boolean): boolean;
  rmdir(uri: string): boolean;
  chmod(uri: string, mode: number): boolean;
  getDestinationFilename(destination: string, replace?: FileExistsAction): string | false;
}

export type FileExistsAction = 'replace' | 'rename' | 'error';

// ---------------------------------------------------------------------------
// Breadcrumb / Pager / Menu
// ---------------------------------------------------------------------------

export interface BreadcrumbInterface {
  getLinks(): Link[];
  addLink(link: Link): void;
  getCacheTags(): string[];
  getCacheContexts(): string[];
}

export interface Link {
  readonly url: string;
  readonly text: string;
  readonly options?: Record<string, unknown>;
}

export interface MenuLinkInterface extends PluginInterface {
  getTitle(): string;
  getRouteName(): string;
  getRouteParameters(): Record<string, unknown>;
  getUrl(): string;
  getParent(): string;
  getWeight(): number;
  isEnabled(): boolean;
  getMenuName(): string;
}

export interface MenuLinkTreeInterface {
  load(menuName: string, parameters?: MenuTreeParameters): MenuLinkTreeElement[];
  build(tree: MenuLinkTreeElement[]): RenderArray;
}

export interface MenuTreeParameters {
  minDepth?: number;
  maxDepth?: number;
  activeTrail?: string[];
  conditions?: Record<string, unknown>;
}

export interface MenuLinkTreeElement {
  link: MenuLinkInterface;
  subtree: MenuLinkTreeElement[];
  depth: number;
  hasChildren: boolean;
  inActiveTrail: boolean;
}

// ---------------------------------------------------------------------------
// Batch
// ---------------------------------------------------------------------------

export interface BatchDefinition {
  operations: Array<[BatchCallable, unknown[]]>;
  finished?: BatchFinishedCallable;
  title?: string;
  init_message?: string;
  progress_message?: string;
  error_message?: string;
}

export type BatchCallable = (context: BatchContext, ...args: unknown[]) => void;
export type BatchFinishedCallable = (success: boolean, results: unknown[], operations: Array<[BatchCallable, unknown[]]>) => void;

export interface BatchContext {
  sandbox: Record<string, unknown>;
  results: unknown[];
  finished: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Datetime
// ---------------------------------------------------------------------------

export interface DrupalDateTimeInterface {
  format(type: string): string;
  getTimestamp(): number;
  setTimezone(timezone: string): this;
  getTimezone(): string;
  add(interval: DateIntervalInterface): this;
  sub(interval: DateIntervalInterface): this;
  diff(date2: DrupalDateTimeInterface, absolute?: boolean): DateIntervalInterface;
}

export interface DateIntervalInterface {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly invert: boolean;
  toSeconds(): number;
}

// ---------------------------------------------------------------------------
// Cron
// ---------------------------------------------------------------------------

export interface CronInterface {
  run(): boolean;
}
