/**
 * Shared contracts for the migrate_drupal module.
 *
 * Ports the structural surface of the types `migrate_drupal` consumes from
 * `migrate` and Drupal core. Deep external dependencies (the full Database,
 * Migration, and Plugin systems) are modelled here as minimal LOCAL interfaces
 * with TODOs — the faithful vertical slice only needs the slice each collaborator
 * exposes to `migrate_drupal`.
 */

// ---------------------------------------------------------------------------
// Database surface (Drupal\Core\Database\Connection)
// ---------------------------------------------------------------------------

/**
 * The schema operations `NodeMigrateType` / `getLegacyDrupalVersion` need from a
 * source-database connection.
 *
 * TODO(@drupaljs/database): replace with the shared Connection/Schema types once
 * the database package lands; this models only `schema()->tableExists()`,
 * `schema()->findTables()`, `select()->countQuery()` and `query()->fetchField()`.
 */
export interface SchemaInterface {
  /** True when a table with the given (already-prefixed) name exists. */
  tableExists(table: string): boolean;
  /** Returns table names matching a SQL LIKE pattern (e.g. `migrate_map_d7_node%`). */
  findTables(pattern: string): string[];
}

/** A result row keyed by column name. */
export type DatabaseRow = Record<string, unknown>;

export interface ConnectionInterface {
  schema(): SchemaInterface;
  /**
   * Returns the row count of a table. Models
   * `select($table)->countQuery()->execute()->fetchField()`.
   */
  countRows(table: string): number;
  /**
   * Runs a parameterised query and returns the first column of the first row.
   * Models `query($sql, $args)->fetchField()`. Returns `undefined` when there is
   * no result (or `false` semantics in PHP).
   */
  queryField(sql: string, args?: Record<string, unknown>): unknown;
}

/**
 * Thrown when a database operation fails because the schema is not what was
 * expected. Ports `Drupal\Core\Database\DatabaseExceptionWrapper`.
 *
 * TODO(@drupaljs/database): re-export from the database package when available.
 */
export class DatabaseExceptionWrapper extends Error {
  constructor(message = '') {
    super(message);
    this.name = 'DatabaseExceptionWrapper';
  }
}

// ---------------------------------------------------------------------------
// Settings / State surface
// ---------------------------------------------------------------------------

/**
 * Read access to immutable site settings. Models `Settings::get()`.
 *
 * TODO(@drupaljs/site): replace with the shared Settings type when available.
 */
export interface SettingsInterface {
  get<T = unknown>(name: string, defaultValue?: T): T;
}

// ---------------------------------------------------------------------------
// Migration-definition surface
// ---------------------------------------------------------------------------

/**
 * The raw migration plugin definition array, as discovered before instantiation.
 * `migration_plugins_alter` mutates these in place. Only the fields the alter
 * hook touches are typed; arbitrary extra keys are permitted.
 *
 * TODO(@drupaljs/module-migrate): align with the migration plugin definition
 * type when the migration plugin manager package exposes one.
 */
export interface MigrationDefinition {
  id: string;
  source?: Record<string, unknown>;
  destination?: Record<string, unknown>;
  process?: Record<string, unknown>;
  migration_dependencies?: {
    required?: unknown[];
    optional?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Discovered migration definitions keyed by plugin id. */
export type MigrationDefinitions = Record<string, MigrationDefinition>;

// ---------------------------------------------------------------------------
// Field plugin surface (Drupal\migrate_drupal\Plugin\MigrateFieldInterface)
// ---------------------------------------------------------------------------

/**
 * A read-only view of a migrate `Row` as the field plugins use it: source and
 * destination property bags addressed by `parent/child` paths.
 *
 * TODO(@drupaljs/module-migrate): reuse the real `Row` once cross-package imports
 * are wired; field plugins only read source/destination properties here.
 */
export interface RowLike {
  getSourceProperty(property: string): unknown;
  getDestinationProperty(property: string): unknown;
}

/**
 * The plugin definition attached to a `MigrateField` plugin. Ports the
 * `#[MigrateField]` attribute / annotation fields.
 */
export interface MigrateFieldDefinition {
  id: string;
  /** Source core major versions this plugin applies to, e.g. `[6]` or `[6, 7]`. */
  core: number[];
  /** Source field type -> destination field type map. */
  type_map?: Record<string, string>;
  source_module: string;
  destination_module: string;
  /** Plugin weight; lower wins when two plugins map the same source type. */
  weight?: number;
  [key: string]: unknown;
}

/**
 * Contract every field plugin implements. Ports the methods of
 * `Drupal\migrate_drupal\Plugin\MigrateFieldInterface` that the vertical slice
 * exercises (type / widget / formatter resolution).
 */
export interface MigrateFieldInterface {
  getPluginId(): string;
  getPluginDefinition(): MigrateFieldDefinition;
  /** Resolves the destination field type for a source row via `type_map`. */
  getFieldType(row: RowLike): string;
  /** Source widget type for a row (defaults to `widget/type`). */
  getFieldWidgetType(row: RowLike): unknown;
  /** Source widget -> destination widget map. */
  getFieldWidgetMap(): Record<string, string>;
  /** Source formatter type for a row (defaults to `formatter/type`). */
  getFieldFormatterType(row: RowLike): unknown;
  /** Source formatter -> destination formatter map. */
  getFieldFormatterMap(): Record<string, string>;
}

// ---------------------------------------------------------------------------
// Permission / routing shapes (*.permissions.yml / *.routing.yml)
// ---------------------------------------------------------------------------

/**
 * A single permission definition. Mirrors a `*.permissions.yml` entry.
 *
 * TODO(@drupaljs/access): replace with the shared permission type when the
 * access/user permission package exposes one.
 */
export interface PermissionDefinition {
  title: string;
  description?: string;
  restrict_access?: boolean;
}
export type PermissionMap = Record<string, PermissionDefinition>;

/**
 * A single route definition. Mirrors a `*.routing.yml` entry.
 *
 * TODO(@drupaljs/routing): replace with the shared route type when available.
 */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, string>;
  requirements?: Record<string, string>;
}
export type RouteCollection = Record<string, RouteDefinition>;
