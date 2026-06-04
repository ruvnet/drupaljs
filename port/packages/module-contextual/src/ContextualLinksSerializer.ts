/**
 * Helper methods to handle contextual links <-> ID conversion.
 *
 * Ports `Drupal\contextual\ContextualLinksSerializer`. The serialized form is:
 *
 *   <group>:<route parameters>:<metadata>
 *
 * where route parameters and metadata are URL query strings, and multiple
 * groups are joined with `|`. A `langcode` is folded into the metadata so a
 * different ID is produced when URLs vary by language.
 */

import {
  LANGUAGE_TYPE_URL,
  type LanguageManagerLike,
} from './contracts.js';

/** A single contextual-links group value. */
export interface ContextualLinkGroup {
  /** Route parameters passed to the URL generator. */
  route_parameters?: Record<string, unknown>;
  /** Additional data needed to alter the link. */
  metadata?: Record<string, unknown>;
}

/** The `#contextual_links` property value: groups keyed by group name. */
export type ContextualLinks = Record<string, ContextualLinkGroup>;

export class ContextualLinksSerializer {
  constructor(private readonly languageManager: LanguageManagerLike) {}

  /**
   * Serializes a `#contextual_links` value array to a string for use in a
   * `data-*` attribute. Ports `linksToId()`.
   */
  linksToId(contextualLinks: ContextualLinks): string {
    const ids: string[] = [];

    const langcode = this.languageManager
      .getCurrentLanguage(LANGUAGE_TYPE_URL)
      .getId();

    for (const [group, args] of Object.entries(contextualLinks)) {
      const routeParameters = buildQuery(args.route_parameters ?? {});
      // Add the current URL language to metadata so a different ID is computed
      // when URLs vary by language.
      const metadata = buildQuery({ ...(args.metadata ?? {}), langcode });
      ids.push(`${group}:${routeParameters}:${metadata}`);
    }

    return ids.join('|');
  }

  /**
   * Unserializes the result of {@link linksToId}. Ports `idToLinks()`.
   *
   * NOTE: `id` is user input. Callers MUST validate it against its signed token
   * (see ContextualController.render) before invoking this method.
   */
  idToLinks(id: string): ContextualLinks {
    const contextualLinks: ContextualLinks = {};

    for (const context of id.split('|')) {
      const [group = '', routeParametersRaw = '', metadataRaw = ''] = context.split(':');
      contextualLinks[group] = {
        route_parameters: parseQuery(routeParametersRaw),
        metadata: parseQuery(metadataRaw),
      };
    }

    return contextualLinks;
  }
}

// ---------------------------------------------------------------------------
// Query-string helpers
// ---------------------------------------------------------------------------

/**
 * Builds an unescaped `key=value&...` query string, porting the relevant
 * behaviour of `Drupal\Component\Utility\UrlHelper::buildQuery()` for the flat
 * (non-nested) parameter maps contextual links use. Empty maps yield `''`.
 *
 * TODO(@drupaljs/util): delegate to the shared UrlHelper once it lands
 * (including nested-array `key[child]=value` support).
 */
function buildQuery(params: Record<string, unknown>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${stringifyValue(value)}`)
    .join('&');
}

/**
 * Parses a flat `key=value&...` query string back into a string-valued map,
 * mirroring PHP `parse_str()` for the flat case. An empty input yields `{}`.
 */
function parseQuery(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (raw === '') {
    return result;
  }
  for (const pair of raw.split('&')) {
    if (pair === '') continue;
    const eq = pair.indexOf('=');
    if (eq === -1) {
      result[pair] = '';
    } else {
      result[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  }
  return result;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}
