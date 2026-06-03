/**
 * @drupaljs/logger — PSR-3 compatible logger channels.
 * Port of Drupal\Core\Logger\LoggerChannelFactory + LoggerChannel.
 * Reference: drupal-core/core/lib/Drupal/Core/Logger/
 */

export type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

export const LOG_LEVELS: LogLevel[] = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];

export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  emergency: 0, alert: 1, critical: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7,
};

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

export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly context: Record<string, unknown>;
  readonly channel: string;
  readonly timestamp: number;
}

/**
 * LoggerChannel — a named logging channel that fans out to multiple loggers.
 * Port of Drupal\Core\Logger\LoggerChannel.
 */
export class LoggerChannel implements LoggerInterface {
  private readonly loggers: Array<{ logger: LoggerInterface; priority: number }> = [];

  constructor(private readonly channel: string) {}

  addLogger(logger: LoggerInterface, priority = 0): void {
    this.loggers.push({ logger, priority });
    this.loggers.sort((a, b) => b.priority - a.priority);
  }

  log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
    for (const { logger } of this.loggers) {
      logger.log(level, message, { ...context, channel: this.channel });
    }
  }

  emergency(message: string, context?: Record<string, unknown>): void { this.log('emergency', message, context); }
  alert(message: string, context?: Record<string, unknown>): void { this.log('alert', message, context); }
  critical(message: string, context?: Record<string, unknown>): void { this.log('critical', message, context); }
  error(message: string, context?: Record<string, unknown>): void { this.log('error', message, context); }
  warning(message: string, context?: Record<string, unknown>): void { this.log('warning', message, context); }
  notice(message: string, context?: Record<string, unknown>): void { this.log('notice', message, context); }
  info(message: string, context?: Record<string, unknown>): void { this.log('info', message, context); }
  debug(message: string, context?: Record<string, unknown>): void { this.log('debug', message, context); }

  getChannel(): string { return this.channel; }
}

/**
 * LoggerChannelFactory — creates and caches named logger channels.
 * Port of Drupal\Core\Logger\LoggerChannelFactory.
 */
export class LoggerChannelFactory {
  private readonly channels = new Map<string, LoggerChannel>();
  private readonly globalLoggers: Array<{ logger: LoggerInterface; priority: number }> = [];

  addLogger(logger: LoggerInterface, priority = 0): void {
    this.globalLoggers.push({ logger, priority });
    // Also add to all existing channels
    for (const channel of this.channels.values()) {
      channel.addLogger(logger, priority);
    }
  }

  get(channel: string): LoggerChannel {
    if (!this.channels.has(channel)) {
      const loggerChannel = new LoggerChannel(channel);
      for (const { logger, priority } of this.globalLoggers) {
        loggerChannel.addLogger(logger, priority);
      }
      this.channels.set(channel, loggerChannel);
    }
    return this.channels.get(channel)!;
  }
}

/**
 * NullLogger — a logger that discards all messages (used in tests).
 */
export class NullLogger implements LoggerInterface {
  log(_level: LogLevel, _message: string, _context?: Record<string, unknown>): void {}
  emergency(_m: string, _c?: Record<string, unknown>): void {}
  alert(_m: string, _c?: Record<string, unknown>): void {}
  critical(_m: string, _c?: Record<string, unknown>): void {}
  error(_m: string, _c?: Record<string, unknown>): void {}
  warning(_m: string, _c?: Record<string, unknown>): void {}
  notice(_m: string, _c?: Record<string, unknown>): void {}
  info(_m: string, _c?: Record<string, unknown>): void {}
  debug(_m: string, _c?: Record<string, unknown>): void {}
}

/**
 * MemoryLogger — captures log records; useful in tests.
 */
export class MemoryLogger implements LoggerInterface {
  readonly records: LogRecord[] = [];

  log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
    this.records.push({ level, message, context, channel: String(context.channel ?? ''), timestamp: Date.now() });
  }

  emergency(message: string, context?: Record<string, unknown>): void { this.log('emergency', message, context); }
  alert(message: string, context?: Record<string, unknown>): void { this.log('alert', message, context); }
  critical(message: string, context?: Record<string, unknown>): void { this.log('critical', message, context); }
  error(message: string, context?: Record<string, unknown>): void { this.log('error', message, context); }
  warning(message: string, context?: Record<string, unknown>): void { this.log('warning', message, context); }
  notice(message: string, context?: Record<string, unknown>): void { this.log('notice', message, context); }
  info(message: string, context?: Record<string, unknown>): void { this.log('info', message, context); }
  debug(message: string, context?: Record<string, unknown>): void { this.log('debug', message, context); }

  clear(): void { this.records.length = 0; }
  getByLevel(level: LogLevel): LogRecord[] { return this.records.filter(r => r.level === level); }
}

/** Interpolate {placeholder} tokens in a log message from context. PSR-3 §1.2 */
export function interpolateMessage(message: string, context: Record<string, unknown>): string {
  return message.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : `{${key}}`;
  });
}
