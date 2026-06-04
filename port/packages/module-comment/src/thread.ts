/**
 * Alphadecimal sorting-code helpers used for comment thread placement.
 *
 * Faithful port of the two helpers the comment module relies on from
 * `Drupal\Component\Utility\Number` (drupal-core/core/lib/Drupal/Component/
 * Utility/Number.php): {@link intToAlphadecimal} / {@link alphadecimalToInt}.
 *
 * A thread code consists of a leading character indicating length followed by N
 * base-36 digits, so codes sort as plain strings without altering numeric order:
 *   00, 01, ..., 0z, 110, 111, ..., 1zz, 2100, ...
 *
 * TODO(@drupaljs/util): move these to the shared util package once it exposes a
 * Number helper; re-export from here for the comment module's convenience.
 */

const ZERO_CHAR_CODE = '0'.charCodeAt(0);

/**
 * Encodes an integer into an alphadecimal sorting code.
 *
 * Ports `Number::intToAlphadecimal()`. Equivalent to PHP's
 * `chr(strlen($num) + ord('0') - 1) . $num` where `$num = base_convert($i, 10, 36)`.
 */
export function intToAlphadecimal(i = 0): string {
  const num = i.toString(36);
  const length = num.length;
  return String.fromCharCode(length + ZERO_CHAR_CODE - 1) + num;
}

/**
 * Decodes an alphadecimal sorting code back to an integer.
 *
 * Ports `Number::alphadecimalToInt()`. The leading length character is dropped
 * and the remainder is parsed as base-36.
 *
 * @throws {Error} If the value (after the leading char) is not alphanumeric.
 */
export function alphadecimalToInt(value = '00'): number {
  const substring = value.slice(1);
  if (substring.length > 0 && !/^[0-9a-z]+$/i.test(substring)) {
    throw new Error(`Invalid characters passed for attempted conversion: ${value}`);
  }
  if (substring === '') {
    return 0;
  }
  return parseInt(substring, 36) || 0;
}
