/**
 * URL helpers ported from `Drupal\Component\Utility\UrlHelper`.
 *
 * Only the subset required by the link field type is ported: scheme detection,
 * external detection, protocol filtering, and parsing into path/query/fragment.
 */

// TODO(@drupaljs/util): move filterBadProtocol / getAllowedProtocols into a
// shared util package once the Component\Utility port lands; the link module
// only needs the link-relevant slice here.

/**
 * Pseudo-schemes used by Drupal for internal links. These are never external.
 *
 * @see \Drupal\Core\Url::fromUri()
 */
const INTERNAL_SCHEMES = new Set(['internal', 'entity', 'route', 'base']);

/**
 * Protocols permitted in href/src style attribute values.
 *
 * Mirrors the default of `UrlHelper::getAllowedProtocols()`.
 */
const ALLOWED_PROTOCOLS = [
  'http',
  'https',
  'ftp',
  'news',
  'nntp',
  'tel',
  'telnet',
  'mailto',
  'irc',
  'ssh',
  'sftp',
  'webcal',
  'rtsp',
];

/** Returns the list of allowed protocols. */
export function getAllowedProtocols(): readonly string[] {
  return ALLOWED_PROTOCOLS;
}

/**
 * Returns the lowercased scheme of a URI, or null when it has none.
 *
 * Mirrors PHP's `parse_url($uri, PHP_URL_SCHEME)` for the cases the link module
 * cares about: a scheme is `[a-z][a-z0-9+.-]*` followed by a colon.
 */
export function getUriScheme(uri: string): string | null {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(uri);
  return match && match[1] ? match[1].toLowerCase() : null;
}

/**
 * Determines whether a URI points to an external resource.
 *
 * Mirrors `UrlHelper::isExternal()` semantics as used by the link field:
 * Drupal's pseudo-schemes (internal:, entity:, route:, base:) are internal,
 * protocol-relative URLs (`//host`) are NOT considered external, and a real
 * scheme present in the allowed protocol list (or any other concrete scheme
 * such as mailto:) is external.
 */
export function isExternalUri(uri: string): boolean {
  // Protocol-relative URLs are treated as not external (and not a valid
  // absolute URL) to avoid open-redirect style issues.
  if (uri.startsWith('//')) {
    return false;
  }
  const scheme = getUriScheme(uri);
  if (scheme === null) {
    return false;
  }
  if (INTERNAL_SCHEMES.has(scheme)) {
    return false;
  }
  return true;
}

/**
 * Strips disallowed protocols from a URI and HTML-escapes the result.
 *
 * Mirrors `UrlHelper::filterBadProtocol()`. Decodes HTML entities and removes
 * whitespace/control noise from the scheme before checking it against the
 * allow-list, defeating obfuscation such as `java\nscript:` or `jav&#x09;a...`.
 */
export function filterBadProtocol(uri: string): string {
  const stripped = stripDangerousProtocols(uri);
  return htmlEscape(stripped);
}

/** Iteratively removes any leading disallowed protocol from a URI. */
export function stripDangerousProtocols(uri: string): string {
  const allowed = new Set(ALLOWED_PROTOCOLS);
  let before: string;
  do {
    before = uri;
    const colon = uri.indexOf(':');
    if (colon === -1) {
      break;
    }
    const candidate = uri.slice(0, colon);
    // A scheme cannot contain a path/query separator; if either appears before
    // the colon there is no scheme to strip. (A literal '#' is intentionally
    // not excluded here because it may be part of an HTML entity such as
    // '&#x09;' used to obfuscate the scheme.)
    if (/[/?]/.test(candidate)) {
      break;
    }
    // Normalise the candidate scheme: decode entities then drop everything that
    // is not a scheme-legal character (letters, digits, +, ., -).
    const normalised = decodeHtmlEntities(candidate)
      .replace(/[^a-zA-Z0-9+.-]/g, '')
      .toLowerCase();
    if (allowed.has(normalised)) {
      break;
    }
    // Disallowed (or obfuscated) scheme: strip it and re-check.
    uri = uri.slice(colon + 1);
  } while (uri !== before);
  return uri;
}

/**
 * Splits a string into path, query and fragment.
 *
 * Mirrors `UrlHelper::parse()` for the subset the link module needs.
 */
export function parse(str: string): {
  path: string;
  query: Record<string, string>;
  fragment: string;
} {
  let fragment = '';
  let rest = str;
  const hashIndex = rest.indexOf('#');
  if (hashIndex !== -1) {
    fragment = rest.slice(hashIndex + 1);
    rest = rest.slice(0, hashIndex);
  }

  const query: Record<string, string> = {};
  const queryIndex = rest.indexOf('?');
  if (queryIndex !== -1) {
    const queryString = rest.slice(queryIndex + 1);
    rest = rest.slice(0, queryIndex);
    for (const pair of queryString.split('&')) {
      if (pair === '') continue;
      const eq = pair.indexOf('=');
      if (eq === -1) {
        query[decodeURIComponent(pair)] = '';
      } else {
        const key = decodeURIComponent(pair.slice(0, eq));
        const value = decodeURIComponent(pair.slice(eq + 1));
        query[key] = value;
      }
    }
  }

  return { path: rest, query, fragment };
}

/**
 * Parses a stored link URI into its addressable parts plus an external flag.
 *
 * Used by the field type to resolve a URI into an href and option set.
 */
export function parseUri(uri: string): {
  external: boolean;
  path: string;
  query: Record<string, string>;
  fragment: string;
} {
  const external = isExternalUri(uri);
  const scheme = getUriScheme(uri);
  // For Drupal pseudo-schemes the path is everything after the scheme.
  let target = uri;
  if (scheme !== null && INTERNAL_SCHEMES.has(scheme)) {
    target = uri.slice(scheme.length + 1);
  }
  const { path, query, fragment } = parse(target);
  return { external, path, query, fragment };
}

/** Minimal HTML entity decoder covering numeric + common named entities. */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);?/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'");
}

/** Escapes HTML special characters, mirroring Drupal's Html::escape(). */
export function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
