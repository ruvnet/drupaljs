/**
 * Provides helper methods for byte conversions.
 *
 * Ported from Drupal\Component\Utility\Bytes.
 */

const KILOBYTE = 1024;

/** Allowed lowercase suffixes for a byte string. */
const ALLOWED_SUFFIXES = [
  '',
  'b',
  'byte',
  'bytes',
  'k',
  'kb',
  'kilobyte',
  'kilobytes',
  'm',
  'mb',
  'megabyte',
  'megabytes',
  'g',
  'gb',
  'gigabyte',
  'gigabytes',
  't',
  'tb',
  'terabyte',
  'terabytes',
  'p',
  'pb',
  'petabyte',
  'petabytes',
  'e',
  'eb',
  'exabyte',
  'exabytes',
  'z',
  'zb',
  'zettabyte',
  'zettabytes',
  'y',
  'yb',
  'yottabyte',
  'yottabytes',
];

// Order of magnitude lookup, matching PHP's stripos('bkmgtpezy', $unit[0]).
const MAGNITUDE_ORDER = 'bkmgtpezy';

export const Bytes = {
  KILOBYTE,
  ALLOWED_SUFFIXES,

  /**
   * Parses a given byte size into a number of bytes.
   *
   * @param size An integer, float, or string size expressed as a number of
   *   bytes with optional SI/IEC unit prefix (e.g. 2, 2.4, '3K', '5MB',
   *   '10G', '6GiB', '8 bytes', '9mbytes').
   * @returns The size in bytes, rounded to the nearest integer.
   */
  toNumber(size: number | string): number {
    const str = String(size);
    // Extract the first unit letter (b, k, m, g, t, p, e, z, y).
    const unitMatch = str.replace(/[^bkmgtpezy]/gi, '');
    // Keep only digits and decimal points for the numeric portion.
    const numeric = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;

    if (unitMatch) {
      const power = MAGNITUDE_ORDER.indexOf(unitMatch[0]!.toLowerCase());
      return Math.round(numeric * Math.pow(KILOBYTE, power));
    }
    return Math.round(numeric);
  },

  /**
   * Validates that a string is a representation of a number of bytes.
   */
  validate(value: string): boolean {
    // Must start with a numeric character.
    if (!/^[0-9]/.test(value)) {
      return false;
    }
    // Strip the leading numeric portion, then trim spaces.
    const suffix = value.replace(/^[0-9.]+/, '').trim().toLowerCase();
    return ALLOWED_SUFFIXES.includes(suffix);
  },

  /**
   * Formats a byte count into a human-readable string using binary prefixes.
   *
   * Not present verbatim in Drupal's Bytes (that lives in
   * StringTranslation::formatSize), but provided here as the natural inverse
   * of toNumber() for this utility package.
   *
   * @param bytes The number of bytes.
   * @param decimals Number of fractional digits for non-byte units.
   */
  format(bytes: number, decimals = 2): string {
    const value = Math.abs(bytes);
    if (value < KILOBYTE) {
      return `${bytes} bytes`;
    }
    const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let power = Math.floor(Math.log(value) / Math.log(KILOBYTE));
    power = Math.min(power, units.length);
    const scaled = bytes / Math.pow(KILOBYTE, power);
    return `${scaled.toFixed(decimals)} ${units[power - 1]}`;
  },
} as const;
