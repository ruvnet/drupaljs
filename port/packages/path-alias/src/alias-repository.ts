/**
 * In-memory path alias repository.
 *
 * Port of `Drupal\path_alias\AliasRepository`. The Drupal original queries a
 * SQL `path_alias` table; this port keeps the same lookup semantics
 * (case-insensitive matching, language fallback, latest-id-wins) over an
 * in-memory record set. A SQL-backed implementation can be added later behind
 * the same {@link AliasRepositoryInterface} seam.
 *
 * TODO(@drupaljs/database): provide a `DatabaseAliasRepository` once the
 * database/entity layer lands; this in-memory variant is the reference/testing
 * backend.
 */

import {
  LANGCODE_NOT_SPECIFIED,
  type AliasRepositoryInterface,
  type PathAliasRecord,
} from './types.js';

/** Whether a record is enabled (status defaults to enabled when unset). */
function isEnabled(record: PathAliasRecord): boolean {
  return record.status !== false;
}

/** Lowercases a string for case-insensitive matching (mirrors mb_strtolower). */
function lower(value: string): string {
  return value.toLowerCase();
}

export class InMemoryAliasRepository implements AliasRepositoryInterface {
  private readonly records: PathAliasRecord[] = [];

  /**
   * Inserts a path alias record. Test/reference helper (not part of the
   * read-only repository interface).
   */
  save(record: PathAliasRecord): void {
    this.records.push(record);
  }

  /**
   * Returns the candidate languages in fallback priority order.
   *
   * Mirrors `AliasRepository::addLanguageFallback`: the language-specific alias
   * is always preferred over the language-neutral one.
   */
  private languageFallback(langcode: string): string[] {
    if (langcode === LANGCODE_NOT_SPECIFIED) {
      return [LANGCODE_NOT_SPECIFIED];
    }
    return [langcode, LANGCODE_NOT_SPECIFIED];
  }

  /**
   * Sorts matching records into resolution order: language-specific before
   * neutral, then most-recently-created (highest id) first.
   */
  private rank(records: PathAliasRecord[], langcode: string): PathAliasRecord[] {
    const order = this.languageFallback(langcode);
    return [...records].sort((a, b) => {
      const langDiff = order.indexOf(a.langcode) - order.indexOf(b.langcode);
      if (langDiff !== 0) return langDiff;
      return b.id - a.id;
    });
  }

  /** Filters records to those matching the language fallback set. */
  private inLanguage(records: PathAliasRecord[], langcode: string): PathAliasRecord[] {
    const order = this.languageFallback(langcode);
    return records.filter((r) => order.includes(r.langcode));
  }

  preloadPathAlias(preloaded: string[], langcode: string): Record<string, string> {
    const aliases: Record<string, string> = {};
    if (preloaded.length === 0) {
      return aliases;
    }

    // Map requested paths to their lowercase form for case-insensitive lookup.
    const pathMap = new Map<string, string>();
    for (const item of preloaded) {
      pathMap.set(item, lower(item));
    }
    const requestedLower = new Set(pathMap.values());

    const candidates = this.inLanguage(
      this.records.filter((r) => isEnabled(r) && requestedLower.has(lower(r.path))),
      langcode,
    );

    // Latest alias per source wins: rank then assign so higher-priority entries
    // are written last (overwriting earlier, lower-priority ones).
    const ranked = this.rank(candidates, langcode).reverse();
    for (const result of ranked) {
      aliases[result.path] = result.alias;
      // If the stored path is not an exact match of a requested path, map the
      // user-provided (differently-cased) path to the alias too.
      if (!pathMap.has(result.path)) {
        for (const [provided, providedLower] of pathMap) {
          if (providedLower === lower(result.path)) {
            aliases[provided] = result.alias;
          }
        }
      }
    }

    return aliases;
  }

  lookupBySystemPath(path: string, langcode: string): PathAliasRecord | null {
    const matches = this.inLanguage(
      this.records.filter((r) => isEnabled(r) && lower(r.path) === lower(path)),
      langcode,
    );
    return this.rank(matches, langcode)[0] ?? null;
  }

  lookupByAlias(alias: string, langcode: string): PathAliasRecord | null {
    const matches = this.inLanguage(
      this.records.filter((r) => isEnabled(r) && lower(r.alias) === lower(alias)),
      langcode,
    );
    return this.rank(matches, langcode)[0] ?? null;
  }

  pathHasMatchingAlias(initialSubstring: string): boolean {
    const prefix = lower(initialSubstring);
    return this.records.some((r) => isEnabled(r) && lower(r.path).startsWith(prefix));
  }
}
