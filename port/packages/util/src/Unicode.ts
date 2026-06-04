/**
 * Unicode-related conversions and operations.
 *
 * Ported from Drupal\Component\Utility\Unicode. PHP's mb_* functions operate on
 * Unicode characters; the JS equivalents here are code-point-aware (via the
 * string iterator and the 'u' regex flag). The PHP environment-detection
 * methods (getStatus/check/convertToUtf8) are PHP-runtime specific and omitted.
 */

/**
 * Word-boundary character class, transcribed from Drupal's
 * PREG_CLASS_WORD_BOUNDARY. Used to detect word boundaries for ucwords() and
 * word-safe truncation.
 */
const PREG_CLASS_WORD_BOUNDARY =
  '\\x{0}-\\x{2F}\\x{3A}-\\x{40}\\x{5B}-\\x{60}\\x{7B}-\\x{A9}\\x{AB}-\\x{B1}\\x{B4}' +
  '\\x{B6}-\\x{B8}\\x{BB}\\x{BF}\\x{D7}\\x{F7}\\x{2C2}-\\x{2C5}\\x{2D2}-\\x{2DF}' +
  '\\x{2E5}-\\x{2EB}\\x{2ED}\\x{2EF}-\\x{2FF}\\x{375}\\x{37E}-\\x{385}\\x{387}\\x{3F6}' +
  '\\x{482}\\x{55A}-\\x{55F}\\x{589}-\\x{58A}\\x{5BE}\\x{5C0}\\x{5C3}\\x{5C6}' +
  '\\x{5F3}-\\x{60F}\\x{61B}-\\x{61F}\\x{66A}-\\x{66D}\\x{6D4}\\x{6DD}\\x{6E9}' +
  '\\x{6FD}-\\x{6FE}\\x{700}-\\x{70F}\\x{7F6}-\\x{7F9}\\x{830}-\\x{83E}' +
  '\\x{964}-\\x{965}\\x{970}\\x{9F2}-\\x{9F3}\\x{9FA}-\\x{9FB}\\x{AF1}\\x{B70}' +
  '\\x{BF3}-\\x{BFA}\\x{C7F}\\x{CF1}-\\x{CF2}\\x{D79}\\x{DF4}\\x{E3F}\\x{E4F}' +
  '\\x{E5A}-\\x{E5B}\\x{F01}-\\x{F17}\\x{F1A}-\\x{F1F}\\x{F34}\\x{F36}\\x{F38}' +
  '\\x{F3A}-\\x{F3D}\\x{F85}\\x{FBE}-\\x{FC5}\\x{FC7}-\\x{FD8}\\x{104A}-\\x{104F}' +
  '\\x{109E}-\\x{109F}\\x{10FB}\\x{1360}-\\x{1368}\\x{1390}-\\x{1399}\\x{1400}' +
  '\\x{166D}-\\x{166E}\\x{1680}\\x{169B}-\\x{169C}\\x{16EB}-\\x{16ED}' +
  '\\x{1735}-\\x{1736}\\x{17B4}-\\x{17B5}\\x{17D4}-\\x{17D6}\\x{17D8}-\\x{17DB}' +
  '\\x{1800}-\\x{180A}\\x{180E}\\x{1940}-\\x{1945}\\x{19DE}-\\x{19FF}' +
  '\\x{1A1E}-\\x{1A1F}\\x{1AA0}-\\x{1AA6}\\x{1AA8}-\\x{1AAD}\\x{1B5A}-\\x{1B6A}' +
  '\\x{1B74}-\\x{1B7C}\\x{1C3B}-\\x{1C3F}\\x{1C7E}-\\x{1C7F}\\x{1CD3}\\x{1FBD}' +
  '\\x{1FBF}-\\x{1FC1}\\x{1FCD}-\\x{1FCF}\\x{1FDD}-\\x{1FDF}\\x{1FED}-\\x{1FEF}' +
  '\\x{1FFD}-\\x{206F}\\x{207A}-\\x{207E}\\x{208A}-\\x{208E}\\x{20A0}-\\x{20B8}' +
  '\\x{2100}-\\x{2101}\\x{2103}-\\x{2106}\\x{2108}-\\x{2109}\\x{2114}' +
  '\\x{2116}-\\x{2118}\\x{211E}-\\x{2123}\\x{2125}\\x{2127}\\x{2129}\\x{212E}' +
  '\\x{213A}-\\x{213B}\\x{2140}-\\x{2144}\\x{214A}-\\x{214D}\\x{214F}' +
  '\\x{2190}-\\x{244A}\\x{249C}-\\x{24E9}\\x{2500}-\\x{2775}\\x{2794}-\\x{2B59}' +
  '\\x{2CE5}-\\x{2CEA}\\x{2CF9}-\\x{2CFC}\\x{2CFE}-\\x{2CFF}\\x{2E00}-\\x{2E2E}' +
  '\\x{2E30}-\\x{3004}\\x{3008}-\\x{3020}\\x{3030}\\x{3036}-\\x{3037}' +
  '\\x{303D}-\\x{303F}\\x{309B}-\\x{309C}\\x{30A0}\\x{30FB}\\x{3190}-\\x{3191}' +
  '\\x{3196}-\\x{319F}\\x{31C0}-\\x{31E3}\\x{3200}-\\x{321E}\\x{322A}-\\x{3250}' +
  '\\x{3260}-\\x{327F}\\x{328A}-\\x{32B0}\\x{32C0}-\\x{33FF}\\x{4DC0}-\\x{4DFF}' +
  '\\x{A490}-\\x{A4C6}\\x{A4FE}-\\x{A4FF}\\x{A60D}-\\x{A60F}\\x{A673}\\x{A67E}' +
  '\\x{A6F2}-\\x{A716}\\x{A720}-\\x{A721}\\x{A789}-\\x{A78A}\\x{A828}-\\x{A82B}' +
  '\\x{A836}-\\x{A839}\\x{A874}-\\x{A877}\\x{A8CE}-\\x{A8CF}\\x{A8F8}-\\x{A8FA}' +
  '\\x{A92E}-\\x{A92F}\\x{A95F}\\x{A9C1}-\\x{A9CD}\\x{A9DE}-\\x{A9DF}' +
  '\\x{AA5C}-\\x{AA5F}\\x{AA77}-\\x{AA79}\\x{AADE}-\\x{AADF}\\x{ABEB}' +
  '\\x{E000}-\\x{F8FF}\\x{FB29}\\x{FD3E}-\\x{FD3F}\\x{FDFC}-\\x{FDFD}' +
  '\\x{FE10}-\\x{FE19}\\x{FE30}-\\x{FE6B}\\x{FEFF}-\\x{FF0F}\\x{FF1A}-\\x{FF20}' +
  '\\x{FF3B}-\\x{FF40}\\x{FF5B}-\\x{FF65}\\x{FFE0}-\\x{FFFD}';

/**
 * The word-boundary class above is written in PCRE `\x{HHHH}` syntax to match
 * Drupal's source verbatim. JS regex literals require `\u{HHHH}` (with the `u`
 * flag), so convert before constructing RegExp objects.
 */
const JS_WORD_BOUNDARY = PREG_CLASS_WORD_BOUNDARY.replace(/\\x\{/g, '\\u{');

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

/** Splits a string into an array of Unicode code-point characters. */
function chars(text: string): string[] {
  return Array.from(text);
}

export const Unicode = {
  STATUS_SINGLEBYTE: 0,
  STATUS_MULTIBYTE: 1,
  STATUS_ERROR: -1,
  PREG_CLASS_WORD_BOUNDARY,

  /**
   * Detects a UTF byte-order mark (BOM) from the first bytes of data.
   *
   * @param data A byte array (or string interpreted as Latin-1 bytes).
   * @returns The encoding name, or false if no BOM is present.
   */
  encodingFromBOM(data: Uint8Array | string): string | false {
    const bytes =
      typeof data === 'string'
        ? Uint8Array.from(data, (c) => c.charCodeAt(0) & 0xff)
        : data;

    const bomMap: Array<[number[], string]> = [
      [[0xef, 0xbb, 0xbf], 'UTF-8'],
      [[0x00, 0x00, 0xfe, 0xff], 'UTF-32BE'],
      [[0xff, 0xfe, 0x00, 0x00], 'UTF-32LE'],
      [[0xfe, 0xff], 'UTF-16BE'],
      [[0xff, 0xfe], 'UTF-16LE'],
      [[0x2b, 0x2f, 0x76, 0x38, 0x2d], 'UTF-7'],
      [[0x2b, 0x2f, 0x76, 0x38], 'UTF-7'],
      [[0x2b, 0x2f, 0x76, 0x39], 'UTF-7'],
      [[0x2b, 0x2f, 0x76, 0x2b], 'UTF-7'],
      [[0x2b, 0x2f, 0x76, 0x2f], 'UTF-7'],
    ];

    for (const [bom, encoding] of bomMap) {
      if (bom.every((b, i) => bytes[i] === b)) {
        return encoding;
      }
    }
    return false;
  },

  /**
   * Truncates a UTF-8 string safely to a number of bytes, never splitting a
   * multi-byte sequence.
   */
  truncateBytes(text: string, len: number): string {
    const bytes = utf8Encoder.encode(text);
    if (bytes.length <= len) {
      return text;
    }
    let cut = len;
    // If the byte at `len` is not a continuation byte (0x80–0xBF), we can cut
    // there; otherwise scan back to the start of the sequence.
    if (!(bytes[cut]! >= 0x80 && bytes[cut]! < 0xc0)) {
      return utf8Decoder.decode(bytes.slice(0, cut));
    }
    while (--cut >= 0 && bytes[cut]! >= 0x80 && bytes[cut]! < 0xc0) {
      // keep scanning backwards
    }
    return utf8Decoder.decode(bytes.slice(0, Math.max(cut, 0)));
  },

  /**
   * Capitalizes the first character of a string (code-point aware).
   */
  ucfirst(text: string): string {
    const list = chars(text);
    if (list.length === 0) {
      return text;
    }
    return list[0]!.toUpperCase() + list.slice(1).join('');
  },

  /**
   * Lowercases the first character of a string (code-point aware).
   */
  lcfirst(text: string): string {
    const list = chars(text);
    if (list.length === 0) {
      return text;
    }
    return list[0]!.toLowerCase() + list.slice(1).join('');
  },

  /**
   * Capitalizes the first character of each word (code-point aware).
   */
  ucwords(text: string): string {
    const regex = new RegExp(
      `(^|[${JS_WORD_BOUNDARY}])([^${JS_WORD_BOUNDARY}])`,
      'gu',
    );
    return text.replace(regex, (_m, boundary: string, letter: string) => {
      return boundary + letter.toUpperCase();
    });
  },

  /**
   * Truncates a string to a number of characters, optionally word-safe and/or
   * with an ellipsis.
   */
  truncate(
    text: string,
    maxLength: number,
    wordsafe = false,
    addEllipsis = false,
    minWordsafeLength = 1,
  ): string {
    let ellipsis = '';
    let max = Math.max(maxLength, 0);
    const minWordsafe = Math.max(minWordsafeLength, 0);

    const list = chars(text);
    if (list.length <= max) {
      return text;
    }

    if (addEllipsis) {
      ellipsis = '…';
      const ellipsisChars = chars(ellipsis);
      ellipsis = ellipsisChars.slice(0, max).join('');
      max -= chars(ellipsis).length;
      max = Math.max(max, 0);
    }

    let doWordsafe = wordsafe;
    if (max <= minWordsafe) {
      doWordsafe = false;
    }

    let result: string;
    if (doWordsafe) {
      const regex = new RegExp(
        `^(.{${minWordsafe},${max}})[${JS_WORD_BOUNDARY}]`,
        'us',
      );
      const match = text.match(regex);
      result = match ? match[1]! : list.slice(0, max).join('');
    } else {
      result = list.slice(0, max).join('');
    }

    if (addEllipsis) {
      result = result.replace(/\.+$/, '');
      result += ellipsis;
    }
    return result;
  },

  /**
   * Case-insensitive comparison of two strings (returns negative/0/positive).
   */
  strcasecmp(str1: string, str2: string): number {
    const a = str1.toUpperCase();
    const b = str2.toUpperCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  },

  /**
   * Checks whether a string is valid UTF-8.
   *
   * JS strings may contain lone surrogates; those round-trip through the strict
   * encoder/decoder lossily, which this detects.
   */
  validateUtf8(text: string): boolean {
    if (text.length === 0) {
      return true;
    }
    try {
      const strict = new TextDecoder('utf-8', { fatal: true });
      const encoded = new TextEncoder().encode(text);
      const decoded = strict.decode(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  },
} as const;
