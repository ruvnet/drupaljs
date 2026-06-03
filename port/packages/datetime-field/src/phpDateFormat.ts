/**
 * Minimal PHP `date()`-pattern formatter, reading UTC components.
 *
 * Drupal renders datetime field values via `DrupalDateTime::format()`, which
 * accepts a PHP date-format string (e.g. the storage pattern `Y-m-d\TH:i:s`, or
 * a site date format). This is a dependency-free port of the subset of format
 * characters the datetime / datetime_range formatters realistically emit.
 *
 * Ref: https://www.php.net/manual/datetime.format.php — and Drupal's
 * DateTimeItemInterface storage patterns.
 *
 * Components are read in UTC: Drupal's STORAGE_TIMEZONE is UTC, and timezone
 * conversion (user/site tz) is a separate concern not modelled in this pure
 * value layer. A backslash escapes the next character as a literal; unknown
 * characters pass through unchanged.
 *
 * NOTE: the full PHP grammar (week numbers, ordinals, timezone tokens, etc.)
 * would belong in a Rust/WASM crate per ADR-0015 if richer site date formats
 * are needed. This covers the storage + common display tokens.
 */

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS_FULL.map((m) => m.slice(0, 3));
const DAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const DAYS_SHORT = DAYS_FULL.map((d) => d.slice(0, 3));

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Format a Date using a PHP-style date pattern, reading UTC components.
 *
 * @param date - The instant to format (interpreted in UTC).
 * @param pattern - A PHP `date()` format string. `\` escapes the next char.
 */
export function phpDateFormat(date: Date, pattern: string): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  const dow = date.getUTCDay(); // 0=Sun
  const hours24 = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const isoDow = dow === 0 ? 7 : dow; // ISO: Mon=1..Sun=7
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i]!;

    if (ch === '\\') {
      // Escape: emit the next character literally.
      i += 1;
      if (i < pattern.length) {
        out += pattern[i];
      }
      continue;
    }

    switch (ch) {
      // Year
      case 'Y': out += String(year); break;
      case 'y': out += pad2(year % 100); break;
      // Month
      case 'm': out += pad2(month + 1); break;
      case 'n': out += String(month + 1); break;
      case 'F': out += MONTHS_FULL[month]; break;
      case 'M': out += MONTHS_SHORT[month]; break;
      // Day
      case 'd': out += pad2(day); break;
      case 'j': out += String(day); break;
      // Weekday
      case 'l': out += DAYS_FULL[dow]; break;
      case 'D': out += DAYS_SHORT[dow]; break;
      case 'N': out += String(isoDow); break;
      case 'w': out += String(dow); break;
      // Hours
      case 'H': out += pad2(hours24); break;
      case 'G': out += String(hours24); break;
      case 'h': out += pad2(hours12); break;
      case 'g': out += String(hours12); break;
      // Minutes / seconds
      case 'i': out += pad2(minutes); break;
      case 's': out += pad2(seconds); break;
      // Meridiem
      case 'A': out += hours24 < 12 ? 'AM' : 'PM'; break;
      case 'a': out += hours24 < 12 ? 'am' : 'pm'; break;
      // Anything else: literal pass-through.
      default: out += ch;
    }
  }

  return out;
}
