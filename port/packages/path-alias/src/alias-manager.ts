/**
 * The default alias manager implementation.
 *
 * Port of `Drupal\path_alias\AliasManager`. Resolves aliases to system paths
 * and vice versa, with per-language static caches and a prefix-list fast path.
 *
 * The Drupal original additionally integrates with a `CacheBackendInterface`
 * and `TimeInterface` for a cross-request preload cache plus Fiber-based batch
 * collection of requested paths. Those are pure optimizations (the comment in
 * `cacheClear` notes a missing preload entry only makes lookups "less
 * efficient", never incorrect), so this port omits them. The lookup semantics
 * are preserved exactly.
 *
 * TODO(@drupaljs/cache): wire an optional cross-request preload cache through
 * `CacheBackendInterface` + `TimeInterface` once those collaborators are needed
 * for performance parity.
 */

import {
  LANGUAGE_TYPE_URL,
  type AliasManagerInterface,
  type AliasPrefixListInterface,
  type AliasRepositoryInterface,
  type LanguageManagerInterface,
} from './types.js';

/** Returns the first path component (mirrors `strtok(trim($path,'/'), '/')`). */
function firstComponent(path: string): string {
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const slash = trimmed.indexOf('/');
  return slash === -1 ? trimmed : trimmed.slice(0, slash);
}

export class AliasManager implements AliasManagerInterface {
  /** Map of path -> alias lookups, keyed by language code. */
  private lookupMap: Record<string, Record<string, string>> = {};

  /** Aliases for which no path was found, keyed by language code. */
  private noPath: Record<string, Set<string>> = {};

  /** Paths that have no alias, keyed by language code. */
  private noAlias: Record<string, Set<string>> = {};

  constructor(
    private readonly pathAliasRepository: AliasRepositoryInterface,
    private readonly pathPrefixes: AliasPrefixListInterface,
    private readonly languageManager: LanguageManagerInterface,
  ) {}

  private resolveLangcode(langcode?: string | null): string {
    return langcode || this.languageManager.getCurrentLanguage(LANGUAGE_TYPE_URL).getId();
  }

  getPathByAlias(alias: string, langcode?: string | null): string {
    const lang = this.resolveLangcode(langcode);

    // Known to have no path, or empty alias: return as-is.
    if (!alias || this.noPath[lang]?.has(alias)) {
      return alias;
    }

    // Look for the alias within the cached map (reverse lookup: value -> key).
    const map = this.lookupMap[lang];
    if (map) {
      for (const path of Object.keys(map)) {
        if (map[path] === alias) {
          return path;
        }
      }
    }

    // Look for the path in storage.
    const pathAlias = this.pathAliasRepository.lookupByAlias(alias, lang);
    if (pathAlias) {
      (this.lookupMap[lang] ??= {})[pathAlias.path] = pathAlias.alias;
      return pathAlias.path;
    }

    // No path found: cache the negative result.
    (this.noPath[lang] ??= new Set()).add(alias);
    return alias;
  }

  getAliasByPath(path: string, langcode?: string | null): string {
    if (!path.startsWith('/')) {
      throw new RangeError(`Source path ${path} has to start with a slash.`);
    }

    const lang = this.resolveLangcode(langcode);

    // Prefix fast path: if the top-level component isn't aliased, bail out.
    if (path === '/' || !this.pathPrefixes.get(firstComponent(path))) {
      return path;
    }

    // Known to have no alias.
    if (this.noAlias[lang]?.has(path)) {
      return path;
    }

    // Already loaded.
    const cached = this.lookupMap[lang]?.[path];
    if (cached !== undefined) {
      return cached;
    }

    // Preload from storage for this path.
    const preloaded = this.pathAliasRepository.preloadPathAlias([path], lang);
    const map = (this.lookupMap[lang] ??= {});
    Object.assign(map, preloaded);

    // Record paths with no alias to avoid querying twice.
    if (map[path] === undefined) {
      (this.noAlias[lang] ??= new Set()).add(path);
      return path;
    }

    return map[path];
  }

  cacheClear(source?: string | null): void {
    if (source) {
      for (const lang of Object.keys(this.lookupMap)) {
        delete this.lookupMap[lang]?.[source];
      }
    } else {
      this.lookupMap = {};
    }
    this.noPath = {};
    this.noAlias = {};
    this.prefixListRebuild(source ?? null);
  }

  /**
   * Rebuilds the prefix list.
   *
   * When a path is inserted, only rebuild if its top-level component is not
   * already in the prefix list.
   */
  private prefixListRebuild(path: string | null): void {
    if (path) {
      if (this.pathPrefixes.get(firstComponent(path))) {
        return;
      }
    }
    this.pathPrefixes.clear();
  }
}
