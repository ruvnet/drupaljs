/**
 * Message placeholder parsing.
 *
 * Ports the relevant behaviour of
 * `Drupal\Core\Logger\LogMessageParser::parseMessagePlaceholders()`: given a
 * PSR-3 / t()-style message and a context map, extract only the entries whose
 * keys are real placeholders (prefixed with `@`, `%`, or `:`) that appear in
 * the message. Non-placeholder context keys (channel, uid, ip, ...) are ignored.
 */
import type { LogContext } from './types.js';

const PLACEHOLDER_PREFIXES = ['@', '%', ':'];

/**
 * Returns the subset of `context` that are message placeholders.
 *
 * A PSR-3 message uses `{name}` placeholders; Drupal converts those to its own
 * `@name` form. To stay faithful while keeping the slice small, we accept keys
 * already in Drupal placeholder form (`@`/`%`/`:` prefixed) and also map bare
 * PSR-3 `{name}` occurrences to `@name`.
 */
export function parseMessagePlaceholders(
  message: string,
  context: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (PLACEHOLDER_PREFIXES.includes(key.charAt(0))) {
      result[key] = value;
    }
  }

  // Map PSR-3 `{name}` placeholders present in the message to `@name`.
  const psr3 = message.matchAll(/\{([a-zA-Z0-9_.]+)\}/g);
  for (const match of psr3) {
    const name = match[1]!;
    if (Object.prototype.hasOwnProperty.call(context, name)) {
      result['@' + name] = context[name];
    }
  }

  return result;
}

/** Convenience overload that accepts a full {@link LogContext}. */
export function parseLogContextPlaceholders(
  message: string,
  context: LogContext,
): Record<string, unknown> {
  return parseMessagePlaceholders(message, context as Record<string, unknown>);
}
