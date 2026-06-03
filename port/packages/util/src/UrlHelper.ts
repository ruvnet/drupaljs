/**
 * URL-based helper methods.
 *
 * Ported from Drupal\Component\Utility\UrlHelper. Compression helpers
 * (compressQueryParameter/uncompressQueryParameter, which rely on gzcompress)
 * and externalIsLocal are out of scope for this initial port.
 */

import { Html } from './Html.js';

/** Query value tree: scalars, null, nested objects, or arrays thereof. */
export type QueryValue = string | number | boolean | null | QueryTree | QueryValue[];
export interface QueryTree {
  [key: string]: QueryValue;
}

export interface ParsedUrl {
  /** Path component; for external URLs includes scheme/authority/path. */
  path: string | null;
  /** Parsed query parameters. */
  query: QueryTree;
  /** Fragment component (without the leading '#'). */
  fragment: string;
}

let allowedProtocols: string[] = ['http', 'https'];

/**
 * RFC3986 rawurlencode equivalent (does not encode A-Z a-z 0-9 - _ . ~).
 */
function rawurlencode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Parses a query string into a nested tree, supporting PHP-style bracket keys
 * (e.g. "a[b]=1&a[c]=2" → { a: { b: '1', c: '2' } }).
 */
function parseQueryString(qs: string): QueryTree {
  const result: QueryTree = {};
  if (qs === '') {
    return result;
  }
  for (const pair of qs.split('&')) {
    if (pair === '') continue;
    const eq = pair.indexOf('=');
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawVal = eq === -1 ? '' : pair.slice(eq + 1);
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));

    // Decompose bracketed keys: "a[b][c]" → ['a','b','c'].
    const match = key.match(/^([^[]+)((?:\[[^\]]*\])*)$/);
    if (!match) {
      result[key] = val;
      continue;
    }
    const segments = [match[1]!];
    const bracketPart = match[2] ?? '';
    for (const m of bracketPart.matchAll(/\[([^\]]*)\]/g)) {
      segments.push(m[1]!);
    }

    let node: QueryTree = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      if (typeof node[seg] !== 'object' || node[seg] === null || Array.isArray(node[seg])) {
        node[seg] = {};
      }
      node = node[seg] as QueryTree;
    }
    node[segments[segments.length - 1]!] = val;
  }
  return result;
}

export const UrlHelper = {
  /**
   * Builds a query string encoded with rawurlencode().
   *
   * @param query The query parameter tree.
   * @param parent Internal: prefix used to build nested keys.
   */
  buildQuery(query: QueryTree, parent = ''): string {
    const params: string[] = [];
    for (const [rawKey, value] of Object.entries(query)) {
      const key = parent
        ? parent + rawurlencode(`[${rawKey}]`)
        : rawurlencode(rawKey);

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        params.push(UrlHelper.buildQuery(value, key));
      } else if (Array.isArray(value)) {
        // Treat arrays as integer-keyed nested trees.
        const tree: QueryTree = {};
        value.forEach((v, i) => {
          tree[String(i)] = v as QueryValue;
        });
        params.push(UrlHelper.buildQuery(tree, key));
      } else if (value === null || value === undefined) {
        params.push(key);
      } else {
        // For readability, decode slashes back from %2F.
        params.push(`${key}=${rawurlencode(String(value)).replace(/%2F/g, '/')}`);
      }
    }
    return params.join('&');
  },

  /**
   * Filters a query parameter tree to remove unwanted keys.
   *
   * @param query The tree to filter.
   * @param exclude Keys to remove; use "parent[child]" for nested items.
   * @param parent Internal: prefix for building nested string keys.
   */
  filterQueryParameters(
    query: QueryTree,
    exclude: string[] = [],
    parent = '',
  ): QueryTree {
    if (exclude.length === 0) {
      return query;
    }
    const excludeSet = new Set(exclude);
    const params: QueryTree = {};
    for (const [key, value] of Object.entries(query)) {
      const stringKey = parent ? `${parent}[${key}]` : key;
      if (excludeSet.has(stringKey)) {
        continue;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        params[key] = UrlHelper.filterQueryParameters(value, exclude, stringKey);
      } else {
        params[key] = value;
      }
    }
    return params;
  },

  /**
   * Parses a URL into path, query, and fragment components.
   *
   * For external URLs (containing '://' before any '?'/'#'), the scheme,
   * authority, and path are grouped into `path`.
   */
  parse(url: string): ParsedUrl {
    const options: ParsedUrl = { path: null, query: {}, fragment: '' };

    const schemePos = url.indexOf('://');
    const queryPos = url.indexOf('?');
    const fragmentPos = url.indexOf('#');

    const isExternal =
      schemePos !== -1 &&
      (queryPos === -1 || schemePos < queryPos) &&
      (fragmentPos === -1 || schemePos < fragmentPos);

    if (isExternal) {
      let work = url;
      if (fragmentPos !== -1) {
        const hashIdx = work.indexOf('#');
        options.fragment = work.slice(hashIdx + 1);
        work = work.slice(0, hashIdx);
      }
      const qIdx = work.indexOf('?');
      const beforeQuery = qIdx === -1 ? work : work.slice(0, qIdx);
      const afterScheme = beforeQuery.slice(beforeQuery.indexOf('://') + 3);
      if (afterScheme !== '') {
        options.path = beforeQuery;
      }
      if (qIdx !== -1) {
        options.query = parseQueryString(work.slice(qIdx + 1));
      }
    } else {
      // Internal URL. Split fragment, then query, then path.
      let work = url;
      const hashIdx = work.indexOf('#');
      if (hashIdx !== -1) {
        options.fragment = work.slice(hashIdx + 1);
        work = work.slice(0, hashIdx);
      }
      const qIdx = work.indexOf('?');
      if (qIdx !== -1) {
        options.query = parseQueryString(work.slice(qIdx + 1));
        work = work.slice(0, qIdx);
      }
      options.path = work;
    }

    return options;
  },

  /**
   * Encodes a Drupal path for use in a URL, leaving slashes unescaped.
   */
  encodePath(path: string): string {
    return rawurlencode(path).replace(/%2F/g, '/');
  },

  /**
   * Determines whether a path is external to this installation.
   */
  isExternal(path: string): boolean {
    const colonPosition = path.indexOf(':');
    // Browsers treat backslashes as slashes; normalize.
    const normalized = path.replace(/\\/g, '/');

    if (normalized.startsWith('//')) {
      return true;
    }
    // Leading control/unassigned/private characters → treat as external.
    if (/^\p{C}/u.test(normalized)) {
      return true;
    }
    return (
      colonPosition !== -1 &&
      !/[/?#]/.test(path.slice(0, colonPosition)) &&
      UrlHelper.stripDangerousProtocols(path) === path
    );
  },

  /**
   * Strips dangerous protocols (e.g. 'javascript:') from a URI iteratively.
   */
  stripDangerousProtocols(uri: string): string {
    const allowed = new Set(allowedProtocols.map((p) => p.toLowerCase()));
    let current = uri;
    let before: string;
    do {
      before = current;
      const colonPosition = current.indexOf(':');
      if (colonPosition > 0) {
        const protocol = current.slice(0, colonPosition);
        // A slash/question-mark/hash before the colon means it's not a scheme.
        if (/[/?#]/.test(protocol)) {
          break;
        }
        if (!allowed.has(protocol.toLowerCase())) {
          current = current.slice(colonPosition + 1);
        }
      }
    } while (before !== current);
    return current;
  },

  /**
   * Processes an attribute value: strips dangerous protocols and HTML-escapes.
   */
  filterBadProtocol(value: string): string {
    const decoded = Html.decodeEntities(value);
    return Html.escape(UrlHelper.stripDangerousProtocols(decoded));
  },

  /**
   * Gets the list of allowed protocols.
   */
  getAllowedProtocols(): string[] {
    return [...allowedProtocols];
  },

  /**
   * Sets the list of allowed protocols.
   */
  setAllowedProtocols(protocols: string[] = []): void {
    allowedProtocols = [...protocols];
  },

  /**
   * Verifies the syntax of a URL per RFC 3986.
   *
   * @param url The URL to verify.
   * @param absolute Whether to require an absolute URL (with scheme).
   */
  isValid(url: string, absolute = false): boolean {
    if (absolute) {
      return new RegExp(
        "^(?:ftp|https?|feed)://" +
          "(?:(?:(?:[\\w.\\-+!$&'()*+,;=]|%[0-9a-f]{2})+:)*" +
          "(?:[\\w.\\-+%!$&'()*+,;=]|%[0-9a-f]{2})+@)?" +
          "(?:(?:[a-z0-9\\-.]|%[0-9a-f]{2})+" +
          "|(?:\\[(?:[0-9a-f]{0,4}:)*(?:[0-9a-f]{0,4})\\]))" +
          "(?::[0-9]+)?" +
          "(?:[/|?](?:[\\w#!:.?+=&@$'~*,;/()\\[\\]\\-]|%[0-9a-f]{2})*)?$",
        'i',
      ).test(url);
    }
    return /^(?:[\w#!:.?+=&@$'~*,;/()\[\]\-]|%[0-9a-f]{2})+$/i.test(url);
  },
} as const;
