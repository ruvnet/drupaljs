/**
 * Shared contracts and constants for the dblog module.
 *
 * Ports the relevant surface of:
 *  - core/lib/Drupal/Core/Logger/RfcLogLevel.php (severity constants/levels)
 *  - the `watchdog` schema from core/modules/dblog/dblog.install
 *  - the database `Connection` collaborator used by the logger/services
 *
 * Deep external collaborators (the real Database\Connection, LogMessageParser,
 * translation) are modelled as minimal local interfaces marked TODO so this
 * vertical slice stays self-contained and testable.
 */

/**
 * RFC 5424 logging severity levels.
 *
 * Ports `Drupal\Core\Logger\RfcLogLevel` integer constants. Lower = more
 * severe. Matches the `severity` column written to `watchdog`.
 */
export enum RfcLogLevel {
  EMERGENCY = 0,
  ALERT = 1,
  CRITICAL = 2,
  ERROR = 3,
  WARNING = 4,
  NOTICE = 5,
  INFO = 6,
  DEBUG = 7,
}

/**
 * Human-readable labels for each severity, keyed by level.
 * Ports `RfcLogLevel::getLevels()`.
 */
export const RFC_LOG_LEVELS: Readonly<Record<RfcLogLevel, string>> = {
  [RfcLogLevel.EMERGENCY]: 'Emergency',
  [RfcLogLevel.ALERT]: 'Alert',
  [RfcLogLevel.CRITICAL]: 'Critical',
  [RfcLogLevel.ERROR]: 'Error',
  [RfcLogLevel.WARNING]: 'Warning',
  [RfcLogLevel.NOTICE]: 'Notice',
  [RfcLogLevel.INFO]: 'Info',
  [RfcLogLevel.DEBUG]: 'Debug',
};

/**
 * A row of the `watchdog` table.
 *
 * Mirrors the schema fields declared in `dblog_schema()`
 * (core/modules/dblog/dblog.install). `wid` is assigned on insert.
 */
export interface WatchdogEntry {
  /** Primary key: unique watchdog event ID (assigned on insert). */
  readonly wid: number;
  /** {users}.uid of the user who triggered the event (0 = anonymous). */
  readonly uid: number;
  /** Log channel/type, e.g. "user" or "page not found" (max 64 chars). */
  readonly type: string;
  /** Untranslated message string (PSR-3 / t() style with placeholders). */
  readonly message: string;
  /** Serialized placeholder variables matching the message string. */
  readonly variables: string;
  /** Severity level (0=Emergency .. 7=Debug). */
  readonly severity: RfcLogLevel;
  /** Optional link to view the result of the event. */
  readonly link: string | null;
  /** URL of the origin of the event (request URI). */
  readonly location: string;
  /** URL of the referring page. */
  readonly referer: string | null;
  /** Hostname/IP of the user who triggered the event (max 128 chars). */
  readonly hostname: string;
  /** Unix timestamp (seconds) of when the event occurred. */
  readonly timestamp: number;
}

/** Field values for a new watchdog row (everything except the generated wid). */
export type WatchdogInsert = Omit<WatchdogEntry, 'wid'>;

/**
 * PSR-3 style log context passed into the logger.
 *
 * Faithful to the keys read by `Drupal\dblog\Logger\DbLog::log()`. `backtrace`
 * and `exception` are stripped before storage (they may be unserializable).
 */
export interface LogContext {
  channel: string;
  uid: number;
  link?: string | null;
  request_uri: string;
  referer?: string | null;
  ip: string;
  timestamp: number;
  backtrace?: unknown;
  exception?: unknown;
  [placeholder: string]: unknown;
}

/**
 * Minimal database connection collaborator used by the dblog services.
 *
 * The real Drupal `Connection` exposes a fluent query builder; this slice models
 * only the operations dblog needs: insert a watchdog row, fetch distinct types,
 * count rows, and prune by row limit. A concrete in-memory implementation lives
 * in {@link InMemoryWatchdogStore}.
 *
 * TODO(@drupaljs/database): replace with the shared Connection/query-builder
 * abstraction once the watchdog table can be expressed through it.
 */
export interface WatchdogStore {
  /** Inserts a row and returns the generated `wid`. */
  insert(row: WatchdogInsert): number;
  /** Loads a single entry by id, or undefined when absent. */
  load(wid: number): WatchdogEntry | undefined;
  /** Returns all entries (most-recent-first ordering is up to the caller). */
  all(): readonly WatchdogEntry[];
  /** Distinct `type` values, ascending — ports DbLogFilters::getMessageTypes(). */
  distinctTypes(): string[];
  /** Total number of rows. */
  count(): number;
  /**
   * Prunes the table to keep at most `rowLimit` most-recent rows
   * (by descending wid). Ports the dblog cron pruning logic.
   * A `rowLimit` of 0 means "keep all" and is a no-op.
   */
  pruneToRowLimit(rowLimit: number): void;
  /** Removes all rows. Ports the "Clear log messages" confirm action. */
  clear(): void;
}

/**
 * Minimal translation collaborator. Drupal uses `t()` / StringTranslationTrait;
 * here a passthrough is sufficient for the slice.
 *
 * TODO(@drupaljs/string-translation): wire to the real translator.
 */
export type Translator = (message: string) => string;

/** Default no-op translator (identity). */
export const passthroughTranslator: Translator = (message) => message;
