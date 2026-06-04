/**
 * Codec for Drupal's datetime storage strings.
 *
 * Drupal stores datetime field values as fixed-format strings in UTC:
 *  - date-and-time: `Y-m-d\TH:i:s`  e.g. `2001-01-15T05:28:07`
 *  - date-only:     `Y-m-d`         e.g. `2001-01-15`
 *
 * Ref: core/modules/datetime/src/Plugin/Validation/Constraint/
 *      DateTimeFormatConstraintValidator.php (strict createFromFormat + hasErrors).
 *
 * Unlike `new Date(string)`, this codec is strict: it validates the exact shape,
 * rejects out-of-range components (e.g. month 13, Feb 30), and never silently
 * coerces a date-only string into a datetime (or vice versa).
 */

import { DateTimeType } from './constants.js';

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Whether the given storage type stores time-of-day.
 *
 * `allday` ranges are stored as date-only values, matching Drupal's storage of
 * the `allday` daterange type.
 */
export function isTimeBearing(type: DateTimeType): boolean {
  return type === DateTimeType.DateTime;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/**
 * Format a Date into a Drupal storage string, reading UTC components.
 *
 * @param date - The instant to format (interpreted in UTC).
 * @param type - The field's `datetime_type` storage setting.
 */
export function formatStorage(date: Date, type: DateTimeType): string {
  const y = pad(date.getUTCFullYear(), 4);
  const mo = pad(date.getUTCMonth() + 1, 2);
  const d = pad(date.getUTCDate(), 2);
  if (!isTimeBearing(type)) {
    return `${y}-${mo}-${d}`;
  }
  const h = pad(date.getUTCHours(), 2);
  const mi = pad(date.getUTCMinutes(), 2);
  const s = pad(date.getUTCSeconds(), 2);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

/**
 * Strictly parse a Drupal storage string into a UTC Date.
 *
 * Returns `null` when the value does not exactly match the format expected for
 * the given `datetime_type`, or when components are out of range. Date-only
 * values are anchored to midnight UTC.
 */
export function parseStorage(value: string, type: DateTimeType): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (isTimeBearing(type)) {
    const m = DATETIME_RE.exec(value);
    if (!m) {
      return null;
    }
    return buildUtcDate(m[1]!, m[2]!, m[3]!, m[4]!, m[5]!, m[6]!);
  }

  const m = DATE_RE.exec(value);
  if (!m) {
    return null;
  }
  return buildUtcDate(m[1]!, m[2]!, m[3]!, '00', '00', '00');
}

function buildUtcDate(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): Date | null {
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);

  // Range pre-checks reject obvious nonsense before constructing the Date.
  if (mo < 1 || mo > 12 || d < 1 || d > 31) {
    return null;
  }
  if (h > 23 || mi > 59 || s > 59) {
    return null;
  }

  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  const date = new Date(ms);

  // Reject overflow (e.g. Feb 30 rolls into March): components must round-trip.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return date;
}

/**
 * Whether the value is a valid storage string for the given type.
 *
 * Equivalent to the DateTimeFormat constraint's success path.
 */
export function isValidStorageValue(value: unknown, type: DateTimeType): boolean {
  return typeof value === 'string' && parseStorage(value, type) !== null;
}
