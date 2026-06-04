/**
 * DbLogController — message formatting for the dblog report pages.
 *
 * Ports the pure core of `Drupal\dblog\Controller\DbLogController`. The full
 * controller assembles render arrays / pager / table markup from the DB; those
 * presentation concerns depend on the render, pager, user-storage and
 * date-formatter subsystems and are out of scope for this slice. The
 * load-bearing, testable piece is {@link formatMessage} (DbLogController::
 * formatMessage()), which unserializes the stored variables and substitutes
 * them into the (admin-XSS-filtered) message.
 */
import type { WatchdogEntry } from './types.js';
import { filterAdmin } from './xss.js';

/**
 * Formats a watchdog row's message.
 *
 * Ports DbLogController::formatMessage():
 *  - returns `false` when message or variables are absent;
 *  - when variables are null → return the admin-filtered raw message;
 *  - when variables are not an array/object → return a corruption notice;
 *  - otherwise substitute the placeholders into the admin-filtered message.
 *
 * @param row A watchdog entry (at minimum `message` + `variables`).
 * @returns The formatted message string, or `false` if required fields missing.
 */
export function formatMessage(
  row: Pick<WatchdogEntry, 'message' | 'variables'> & Partial<WatchdogEntry>,
): string | false {
  if (row.message === undefined || row.variables === undefined) {
    return false;
  }

  let variables: unknown;
  try {
    variables = JSON.parse(row.variables);
  } catch {
    // Unparseable serialized data → treat as null (no variables) like PHP's
    // @unserialize returning NULL/FALSE for an empty/invalid string.
    variables = null;
  }

  if (variables === null) {
    return filterAdmin(row.message);
  }

  if (typeof variables !== 'object') {
    return `Log data is corrupted and cannot be unserialized: ${filterAdmin(row.message)}`;
  }

  return substitutePlaceholders(filterAdmin(row.message), variables as Record<string, unknown>);
}

/**
 * Substitutes Drupal placeholders into a message. `@`/`:` placeholders are
 * inserted as plain text; `%` placeholders are emphasised in Drupal — here we
 * insert the value (the slice does not re-introduce markup).
 */
function substitutePlaceholders(message: string, variables: Record<string, unknown>): string {
  let out = message;
  // Replace longer keys first to avoid partial-prefix collisions.
  for (const key of Object.keys(variables).sort((a, b) => b.length - a.length)) {
    out = out.split(key).join(String(variables[key]));
  }
  return out;
}
