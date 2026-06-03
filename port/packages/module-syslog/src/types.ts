/**
 * Local contracts for @drupaljs/module-syslog.
 *
 * The Drupal `syslog` module's `SysLog` logger depends on
 * `Drupal\Core\Config\ConfigFactoryInterface` and
 * `Drupal\Core\Logger\LogMessageParserInterface`. To keep this vertical slice
 * self-contained (and resolvable without cross-package wiring), narrow local
 * interfaces are defined here.
 *
 * TODO(@drupaljs/config): replace {@link ConfigInterface}/{@link ConfigFactoryInterface}
 *   with the real `@drupaljs/config` Config + ConfigFactory once their published
 *   surface stabilises.
 * TODO(@drupaljs/logger): replace {@link LogMessageParserInterface} with the real
 *   `LogMessageParser` once it lands in `@drupaljs/logger`.
 */

/** Read-only config object surface used by SysLog (Drupal\Core\Config\Config::get). */
export interface ConfigInterface {
  /** Returns a config key's value, or undefined/null when unset. */
  get(key: string): unknown;
}

/** Subset of ConfigFactoryInterface SysLog needs: resolve a named config object. */
export interface ConfigFactoryInterface {
  get(name: string): ConfigInterface;
}

/**
 * Extracts `{placeholder}` variables from a log message + context.
 * Port of Drupal\Core\Logger\LogMessageParserInterface.
 */
export interface LogMessageParserInterface {
  /**
   * Returns the message placeholders found in `context`, keyed by the literal
   * token (e.g. `@type`, `%name`, `:url`) as it appears in the message.
   */
  parseMessagePlaceholders(
    message: string,
    context: Record<string, unknown>,
  ): Record<string, string>;
}

/**
 * RFC 5424 severity levels (integer codes), matching Drupal's RfcLogLevel and
 * the `!severity` token range 0 (Emergency) … 7 (Debug).
 */
export const RfcLogLevel = {
  EMERGENCY: 0,
  ALERT: 1,
  CRITICAL: 2,
  ERROR: 3,
  WARNING: 4,
  NOTICE: 5,
  INFO: 6,
  DEBUG: 7,
} as const;

export type RfcLogLevelValue = (typeof RfcLogLevel)[keyof typeof RfcLogLevel];

/**
 * Log context shape consumed by SysLog when building a syslog entry. Mirrors the
 * keys Drupal's logger pipeline always populates (LoggerChannel::log()).
 */
export interface SyslogContext {
  channel?: string;
  timestamp?: number | string;
  ip?: string;
  request_uri?: string;
  referer?: string;
  uid?: number | string;
  link?: string;
  /** Placeholder values for the message (`@var`, `%var`, `:var`). */
  [key: string]: unknown;
}

/** Shape of the persisted `syslog.settings` config object. */
export interface SyslogSettings {
  identity: string;
  facility: number;
  format: string;
}
