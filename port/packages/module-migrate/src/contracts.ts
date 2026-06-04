/**
 * Shared contracts for the migrate module: status/result enums, exceptions, and
 * the source/process/destination/migration plugin interfaces.
 *
 * Ports the constants and interfaces from drupal-core/core/modules/migrate/src:
 *   - Plugin/MigrateIdMapInterface (status + rollback constants)
 *   - Plugin/MigrationInterface (status/result/message constants)
 *   - Plugin/MigrateSourceInterface, MigrateProcessInterface,
 *     MigrateDestinationInterface
 *   - MigrateExecutableInterface, MigrateMessageInterface
 */

import type { Row } from './row.js';

// ---------------------------------------------------------------------------
// ID-map status / rollback constants (MigrateIdMapInterface)
// ---------------------------------------------------------------------------

/** Source-row processing status stored in the ID map. */
export const IdMapStatus = {
  IMPORTED: 0,
  NEEDS_UPDATE: 1,
  IGNORED: 2,
  FAILED: 3,
} as const;
export type IdMapStatus = (typeof IdMapStatus)[keyof typeof IdMapStatus];

/** Rollback behaviour for an imported destination item. */
export const RollbackAction = {
  DELETE: 0,
  PRESERVE: 1,
} as const;
export type RollbackAction = (typeof RollbackAction)[keyof typeof RollbackAction];

// ---------------------------------------------------------------------------
// Migration status / result / message constants (MigrationInterface)
// ---------------------------------------------------------------------------

export const MigrationStatus = {
  IDLE: 0,
  IMPORTING: 1,
  ROLLING_BACK: 2,
  STOPPING: 3,
  DISABLED: 4,
} as const;
export type MigrationStatus = (typeof MigrationStatus)[keyof typeof MigrationStatus];

export const MigrationResult = {
  COMPLETED: 1,
  INCOMPLETE: 2,
  STOPPED: 3,
  FAILED: 4,
  SKIPPED: 5,
  DISABLED: 6,
} as const;
export type MigrationResult = (typeof MigrationResult)[keyof typeof MigrationResult];

/** Message severity levels. Mirrors MigrationInterface::MESSAGE_*. */
export const MessageLevel = {
  ERROR: 1,
  WARNING: 2,
  NOTICE: 3,
  INFORMATIONAL: 4,
} as const;
export type MessageLevel = (typeof MessageLevel)[keyof typeof MessageLevel];

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------

/**
 * General migrate processing failure. Ports
 * `Drupal\migrate\MigrateException`: carries the ID-map status and message
 * level used to record the failed row.
 */
export class MigrateException extends Error {
  readonly status: IdMapStatus;
  readonly level: MessageLevel;

  constructor(
    message: string,
    status: IdMapStatus = IdMapStatus.FAILED,
    level: MessageLevel = MessageLevel.ERROR,
  ) {
    super(message);
    this.name = 'MigrateException';
    this.status = status;
    this.level = level;
  }
}

/**
 * Aborts the remaining plugins in a single process pipeline. Ports
 * `Drupal\migrate\MigrateSkipProcessException`. The pipeline value becomes null.
 */
export class MigrateSkipProcessException extends Error {
  constructor(message = '') {
    super(message);
    this.name = 'MigrateSkipProcessException';
  }
}

/**
 * Skips the entire current row. Ports `Drupal\migrate\MigrateSkipRowException`.
 * When `saveToMap` is true an IGNORED id-map entry is recorded.
 */
export class MigrateSkipRowException extends Error {
  readonly saveToMap: boolean;

  constructor(message = '', saveToMap = true) {
    super(message);
    this.name = 'MigrateSkipRowException';
    this.saveToMap = saveToMap;
  }
}

// ---------------------------------------------------------------------------
// Message sink (MigrateMessageInterface)
// ---------------------------------------------------------------------------

/** Receives human-readable progress/error messages. */
export interface MigrateMessageInterface {
  display(message: string, type?: string): void;
}

// ---------------------------------------------------------------------------
// Plugin interfaces
// ---------------------------------------------------------------------------

/** Field-definition map keyed by id (e.g. source/destination IDs). */
export type FieldDefinitions = Record<string, Record<string, unknown>>;

/**
 * Source plugin contract. Ports `MigrateSourceInterface` plus the iterator
 * surface that `SourcePluginBase` realises (rewind/valid/current/next), modelled
 * here as explicit methods rather than PHP's Iterator.
 */
export interface MigrateSourceInterface {
  /** Available source fields: machine name -> description. */
  fields(): Record<string, string>;
  /** Unique source-ID field definitions. */
  getIds(): FieldDefinitions;
  /** Rewinds the iterator to the first row. */
  rewind(): void;
  /** True while the cursor points at a valid row. */
  valid(): boolean;
  /** The current row, or null when invalid. */
  current(): Row | null;
  /** Advances to the next source row. */
  next(): void;
  /** Number of source rows. */
  count(): number;
  toString(): string;
}

/**
 * Process plugin contract. Ports `MigrateProcessInterface`. Plugin definitions
 * may set `handle_multiples` to receive array values whole.
 */
export interface MigrateProcessInterface {
  transform(
    value: unknown,
    executable: MigrateExecutableInterface,
    row: Row,
    destinationProperty: string,
  ): unknown;
  /** True when the returned value is a list requiring per-element handling. */
  multiple(): boolean;
  /** True when this plugin requested the pipeline stop. */
  isPipelineStopped(): boolean;
  /** Clears per-invocation internal state. */
  reset(): void;
  getPluginId(): string;
  getPluginDefinition(): { handle_multiples?: boolean; [key: string]: unknown };
}

/**
 * Destination plugin contract. Ports `MigrateDestinationInterface`. `import`
 * returns destination IDs (array), `true` (saved, no IDs), or `false` (failure).
 */
export interface MigrateDestinationInterface {
  getIds(): FieldDefinitions;
  fields(): Record<string, string>;
  import(row: Row, oldDestinationIdValues?: unknown[]): unknown[] | boolean;
  rollback(destinationIdentifier: Record<string, unknown>): void;
  supportsRollback(): boolean;
  rollbackAction(): RollbackAction;
  getPluginId(): string;
}

/**
 * The runtime migration definition the executable drives. A trimmed port of
 * `MigrationInterface` covering exactly what `MigrateExecutable` consumes.
 */
export interface MigrationInterface {
  id(): string;
  getStatus(): MigrationStatus;
  setStatus(status: MigrationStatus): void;
  getStatusLabel(): string;
  getSourcePlugin(): MigrateSourceInterface;
  getDestinationPlugin(): MigrateDestinationInterface;
  /**
   * The process pipeline: destination-property name -> ordered list of process
   * plugins. Mirrors `Migration::getProcessPlugins()`.
   */
  getProcessPlugins(): Record<string, MigrateProcessInterface[]>;
}

/** The executable contract collaborators may reference. */
export interface MigrateExecutableInterface {
  import(): MigrationResult;
  processRow(row: Row, process?: Record<string, MigrateProcessInterface[]>): void;
  saveMessage(message: string, level?: MessageLevel): void;
}

// ---------------------------------------------------------------------------
// Permission / routing shapes (local — *.permissions.yml / *.routing.yml)
// ---------------------------------------------------------------------------

/**
 * A single permission definition. Mirrors the structure of a `*.permissions.yml`
 * entry.
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
 * A single route definition. Mirrors the structure of a `*.routing.yml` entry.
 *
 * TODO(@drupaljs/routing): replace with the shared route type when available.
 */
export interface RouteDefinition {
  path: string;
  defaults?: Record<string, string>;
  requirements?: Record<string, string>;
}
export type RouteCollection = Record<string, RouteDefinition>;
