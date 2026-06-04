/**
 * Port of `Drupal\jsonapi\JsonApiSpec`.
 *
 * Constants and validators used for compliance with the JSON:API specification
 * (https://jsonapi.org/format). Faithful to the PHP original; the member-name
 * regexp is translated to a JS-flavoured Unicode regexp.
 */

// Globally-allowed characters (valid as first/last character of a member name).
// U+0080 and above are allowed by the spec; modelled here as the Unicode
// "not ASCII control/punctuation" set via an explicit range.
const GLOBALLY_ALLOWED = '[a-zA-Z0-9\\u0080-\\uFFFF]';
// Inner characters additionally allow '-', '_' and space.
const INNER_ALLOWED = '[a-zA-Z0-9\\u0080-\\uFFFF\\-_ ]';

/**
 * Member-name validity regexp. Ports JsonApiSpec::MEMBER_NAME_REGEXP:
 * first char globally-allowed; optional run of inner chars ending in a
 * globally-allowed char.
 */
const MEMBER_NAME_REGEXP = new RegExp(
  `^${GLOBALLY_ALLOWED}(${INNER_ALLOWED}*${GLOBALLY_ALLOWED})?$`,
  'u',
);

export class JsonApiSpec {
  /** The minimum supported specification version. */
  static readonly SUPPORTED_SPECIFICATION_VERSION = '1.1';

  /** The URI of the supported specification document. */
  static readonly SUPPORTED_SPECIFICATION_PERMALINK =
    'https://jsonapi.org/format/1.1/';

  /** The URI of the supported specification's JSON Schema. */
  static readonly SUPPORTED_SPECIFICATION_JSON_SCHEMA =
    'https://jsonapi.org/schemas/spec/v1.1/draft';

  /** The reserved (official) query parameters. */
  static readonly RESERVED_QUERY_PARAMETERS: readonly string[] = [
    'filter',
    'sort',
    'page',
    'fields',
    'include',
  ];

  /** The query parameter for providing a version (revision) value. */
  static readonly VERSION_QUERY_PARAMETER = 'resourceVersion';

  /** Gets the reserved (official) JSON:API query parameters. */
  static getReservedQueryParameters(): string[] {
    return [...JsonApiSpec.RESERVED_QUERY_PARAMETERS];
  }

  /**
   * Checks whether the given member name is valid:
   * - at least one character,
   * - only allowed characters,
   * - starts and ends with a globally-allowed character.
   */
  static isValidMemberName(memberName: string): boolean {
    return MEMBER_NAME_REGEXP.test(memberName);
  }

  /**
   * Checks whether a custom query parameter name is valid. In addition to being
   * a valid member name, it MUST contain at least one non a-z character.
   */
  static isValidCustomQueryParameter(name: string): boolean {
    return JsonApiSpec.isValidMemberName(name) && /[^a-z]/u.test(name);
  }
}
