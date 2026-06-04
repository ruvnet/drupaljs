/**
 * DbLog — logs events into the `watchdog` table.
 *
 * Ports `Drupal\dblog\Logger\DbLog`. The PHP class implements PSR-3
 * `LoggerInterface` (via `RfcLoggerTrait`), parses message placeholders, and
 * inserts a row into `watchdog`. On a transient DB error it opens a dedicated
 * connection and retries once; otherwise it rethrows.
 *
 * Here the database is abstracted behind {@link WatchdogStore}. The "dedicated
 * connection" retry is modelled by an optional factory that yields a fresh
 * store to write to when the primary insert throws.
 */
import {
  RfcLogLevel,
  type LogContext,
  type WatchdogStore,
  type WatchdogInsert,
} from './types.js';
import { parseLogContextPlaceholders } from './message-parser.js';

/** Substring length cap for the `type` (channel) column. */
const TYPE_MAX = 64;
/** Substring length cap for the `hostname` (ip) column. */
const HOSTNAME_MAX = 128;

/**
 * Factory producing a dedicated store to retry a failed insert against.
 * Returning `null`/`undefined` (or omitting the factory) means "no retry" and
 * the original error is rethrown — faithful to DbLog's behaviour when already
 * on the dedicated connection target.
 */
export type DedicatedStoreFactory = () => WatchdogStore | null | undefined;

export class DbLog {
  constructor(
    private connection: WatchdogStore,
    private readonly dedicatedStoreFactory?: DedicatedStoreFactory,
  ) {}

  /**
   * {@inheritdoc} — ports DbLog::log().
   */
  log(level: RfcLogLevel, message: string, context: LogContext): void {
    // Remove backtrace and exception since they may be unserializable.
    const { backtrace: _backtrace, exception: _exception, ...rest } = context;
    void _backtrace;
    void _exception;
    const cleanContext = rest as LogContext;

    const placeholders = parseLogContextPlaceholders(message, cleanContext);

    const row: WatchdogInsert = {
      uid: cleanContext.uid,
      type: substr(cleanContext.channel, TYPE_MAX),
      message,
      variables: JSON.stringify(placeholders),
      severity: level,
      link: cleanContext.link ?? null,
      location: cleanContext.request_uri,
      referer: cleanContext.referer ?? null,
      hostname: substr(cleanContext.ip, HOSTNAME_MAX),
      timestamp: cleanContext.timestamp,
    };

    try {
      this.connection.insert(row);
    } catch (error) {
      // Mirror DbLog: on a (transient) DB error, retry once on a dedicated
      // connection. We only have one retry to avoid an endless loop.
      const dedicated = this.dedicatedStoreFactory?.();
      if (dedicated && dedicated !== this.connection) {
        this.connection = dedicated;
        this.connection.insert(row);
      } else {
        throw error;
      }
    }
  }

  emergency(message: string, context: LogContext): void {
    this.log(RfcLogLevel.EMERGENCY, message, context);
  }
  alert(message: string, context: LogContext): void {
    this.log(RfcLogLevel.ALERT, message, context);
  }
  critical(message: string, context: LogContext): void {
    this.log(RfcLogLevel.CRITICAL, message, context);
  }
  error(message: string, context: LogContext): void {
    this.log(RfcLogLevel.ERROR, message, context);
  }
  warning(message: string, context: LogContext): void {
    this.log(RfcLogLevel.WARNING, message, context);
  }
  notice(message: string, context: LogContext): void {
    this.log(RfcLogLevel.NOTICE, message, context);
  }
  info(message: string, context: LogContext): void {
    this.log(RfcLogLevel.INFO, message, context);
  }
  debug(message: string, context: LogContext): void {
    this.log(RfcLogLevel.DEBUG, message, context);
  }
}

/** Ports PHP `mb_substr($value, 0, $max)`. */
function substr(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}
