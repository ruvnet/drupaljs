/**
 * SysLog — redirects logging messages to the system logger.
 * Port of Drupal\syslog\Logger\SysLog
 * (core/modules/syslog/src/Logger/SysLog.php).
 *
 * The PHP class uses RfcLoggerTrait + the procedural `openlog()`/`syslog()`
 * functions. In the TS port those system calls are abstracted behind injectable
 * collaborators ({@link SysLogOptions.openConnection} / {@link SysLogOptions.sink})
 * so the logger is fully testable and platform-agnostic — the equivalent of the
 * `syslogWrapper()` seam the original adds for tests.
 */
import type {
  ConfigFactoryInterface,
  ConfigInterface,
  LogMessageParserInterface,
  SyslogContext,
} from '../types.js';

/** Strip HTML tags (port of PHP strip_tags), used for `!link` and `!message`. */
function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/** Injectable platform/IO seams for SysLog. */
export interface SysLogOptions {
  /**
   * Site base URL substituted for the `!base_url` token. In Drupal this is the
   * `$base_url` global.
   */
  baseUrl?: string;
  /**
   * Opens the system logger connection (port of `openlog()`); returns true on
   * success. Called at most once. Defaults to a no-op that reports success.
   */
  openConnection?: (identity: string, facility: number) => boolean;
  /**
   * Writes an entry to the system logger (port of `syslog()`/`syslogWrapper()`).
   * Defaults to a no-op.
   */
  sink?: (level: number, entry: string) => void;
}

export class SysLog {
  private readonly config: ConfigInterface;
  private readonly parser: LogMessageParserInterface;
  private readonly options: Required<SysLogOptions>;

  /** Whether a system logger connection has been opened (lazy, once). */
  private connectionOpened = false;
  /** Whether we have already attempted to open the connection. */
  private connectionAttempted = false;

  constructor(
    configFactory: ConfigFactoryInterface,
    parser: LogMessageParserInterface,
    options: SysLogOptions = {},
  ) {
    this.config = configFactory.get('syslog.settings');
    this.parser = parser;
    this.options = {
      baseUrl: options.baseUrl ?? '',
      openConnection: options.openConnection ?? (() => true),
      sink: options.sink ?? (() => {}),
    };
  }

  /**
   * Opens a connection to the system logger.
   * Port of SysLog::openConnection(). Does nothing if identity or facility are
   * unconfigured (faithful to the PHP early return).
   */
  private openConnection(): void {
    if (this.connectionAttempted) {
      return;
    }
    this.connectionAttempted = true;
    const identity = this.config.get('identity');
    const facility = this.config.get('facility');
    if (identity === null || identity === undefined || facility === null || facility === undefined) {
      return;
    }
    this.connectionOpened = this.options.openConnection(String(identity), Number(facility));
  }

  /**
   * Logs a message at the given RFC 5424 severity level.
   * Port of SysLog::log().
   */
  log(level: number, message: string, context: SyslogContext = {}): void {
    const format = this.config.get('format');
    // No format configured (e.g. mid-install): write nothing.
    if (format === null || format === undefined || format === '') {
      return;
    }

    this.openConnection();
    if (!this.connectionOpened) {
      return;
    }

    // Populate the message placeholders and replace them in the message.
    const placeholders = this.parser.parseMessagePlaceholders(message, context);
    const resolvedMessage =
      Object.keys(placeholders).length === 0 ? message : strtr(message, placeholders);

    const entry = strtr(String(format), {
      '!base_url': this.options.baseUrl,
      '!timestamp': String(context.timestamp ?? ''),
      '!type': String(context.channel ?? ''),
      '!ip': String(context.ip ?? ''),
      '!request_uri': String(context.request_uri ?? ''),
      '!referer': String(context.referer ?? ''),
      '!severity': String(level),
      '!uid': String(context.uid ?? ''),
      '!link': stripTags(String(context.link ?? '')),
      '!message': stripTags(resolvedMessage),
    });

    this.options.sink(level, entry);
  }
}

/**
 * Port of PHP `strtr($str, $replacePairs)`: replaces all occurrences of each
 * key with its value, preferring the longest key at each position and never
 * re-scanning already-substituted text (so tokens cannot chain-replace).
 */
export function strtr(subject: string, pairs: Record<string, string>): string {
  const keys = Object.keys(pairs).filter((k) => k.length > 0).sort((a, b) => b.length - a.length);
  if (keys.length === 0) {
    return subject;
  }
  let result = '';
  let i = 0;
  outer: while (i < subject.length) {
    for (const key of keys) {
      if (subject.startsWith(key, i)) {
        result += pairs[key];
        i += key.length;
        continue outer;
      }
    }
    result += subject[i];
    i += 1;
  }
  return result;
}
