/**
 * Public contracts and supporting types for the path_alias subsystem.
 *
 * Source: drupal-core/core/modules/path_alias/src/*Interface.php
 */

/**
 * Language code constant for content with no specified language.
 *
 * Mirrors `Drupal\Core\Language\LanguageInterface::LANGCODE_NOT_SPECIFIED`.
 */
export const LANGCODE_NOT_SPECIFIED = 'und';

/**
 * The URL language type constant.
 *
 * Mirrors `Drupal\Core\Language\LanguageInterface::TYPE_URL`.
 */
export const LANGUAGE_TYPE_URL = 'language_url';

// TODO(@drupaljs/language): replace the two minimal types below with the
// canonical `LanguageInterface` / `LanguageManagerInterface` exports once the
// `@drupaljs/language` package defines them. The `language` package currently
// ships no source.

/** Minimal language value object used for current-language resolution. */
export interface LanguageLike {
  /** The language code, e.g. `en`, `de`, or `und`. */
  getId(): string;
}

/**
 * Minimal language manager seam.
 *
 * Mirrors the single method the AliasManager depends on.
 */
export interface LanguageManagerInterface {
  /**
   * Returns the current language for the given type.
   *
   * @param type - A language type constant (e.g. `LANGUAGE_TYPE_URL`).
   */
  getCurrentLanguage(type?: string): LanguageLike;
}

/**
 * A single stored path alias record.
 *
 * Mirrors the associative array returned by the alias repository
 * (`id`, `path`, `alias`, `langcode`).
 */
export interface PathAliasRecord {
  /** The unique alias id. */
  id: number;
  /** The internal system path, e.g. `/node/1`. */
  path: string;
  /** The public alias, e.g. `/about`. */
  alias: string;
  /** The language code the alias applies to. */
  langcode: string;
  /** Whether the alias is enabled. Defaults to enabled when omitted. */
  status?: boolean;
}

/**
 * Provides path alias lookup operations.
 *
 * Port of `Drupal\path_alias\AliasRepositoryInterface`.
 */
export interface AliasRepositoryInterface {
  /**
   * Pre-loads path alias information for a list of system paths.
   *
   * @param preloaded - System paths that need preloading of aliases.
   * @param langcode - Language code to search with (falls back to neutral).
   * @returns System path (key) to alias (value) mapping.
   */
  preloadPathAlias(preloaded: string[], langcode: string): Record<string, string>;

  /**
   * Searches a path alias for a given system path.
   *
   * @returns The matching record, or `null` if none was found.
   */
  lookupBySystemPath(path: string, langcode: string): PathAliasRecord | null;

  /**
   * Searches a path alias for a given alias.
   *
   * @returns The matching record, or `null` if none was found.
   */
  lookupByAlias(alias: string, langcode: string): PathAliasRecord | null;

  /**
   * Checks if any alias exists whose path starts with `initialSubstring`.
   */
  pathHasMatchingAlias(initialSubstring: string): boolean;
}

/**
 * Caches a list of valid alias prefixes.
 *
 * Port of `Drupal\path_alias\AliasPrefixListInterface`. The list holds the
 * first path component of every aliased system path (e.g. `node` for
 * `/node/12345`), allowing the manager to skip lookups for un-aliased prefixes.
 */
export interface AliasPrefixListInterface {
  /**
   * Returns whether the prefix is present in the list.
   *
   * @param key - The first path component to test (without leading slash).
   */
  get(key: string): boolean;

  /** Clears the prefix list, forcing a rebuild on next access. */
  clear(): void;
}

/**
 * Finds an alias for a path and vice versa.
 *
 * Port of `Drupal\path_alias\AliasManagerInterface`.
 */
export interface AliasManagerInterface {
  /**
   * Given the alias, return the path it represents.
   *
   * @param alias - An alias.
   * @param langcode - An optional language code to look up the path in.
   * @returns The path represented by alias, or the alias if none was found.
   * @throws {RangeError} If the alias does not start with a slash.
   */
  getPathByAlias(alias: string, langcode?: string | null): string;

  /**
   * Given a path, return the alias.
   *
   * @param path - A system path.
   * @param langcode - An optional language code to look up the alias in.
   * @returns An alias for the path, or the path if none was found.
   * @throws {RangeError} If the path does not start with a slash.
   */
  getAliasByPath(path: string, langcode?: string | null): string;

  /**
   * Clears the static caches and rebuilds the prefix list.
   *
   * @param source - Source path being inserted/updated. If omitted, the entire
   *   lookup static cache is cleared and the prefix list is rebuilt.
   */
  cacheClear(source?: string | null): void;
}

// TODO(@drupaljs/routing): replace `RequestLike` and the processor option types
// with the canonical Symfony-style `Request` / path-processor contracts once
// `@drupaljs/routing` (or `@drupaljs/http-kernel`) defines them.

/** Minimal request seam for the path processors (currently unused at runtime). */
export interface RequestLike {
  [key: string]: unknown;
}

/** Options bag passed to {@link OutboundPathProcessorInterface.processOutbound}. */
export interface PathProcessorOptions {
  /** When truthy, the path is already an alias and is returned unchanged. */
  alias?: boolean;
  /** Optional language override used for outbound alias lookup. */
  language?: LanguageLike;
  [key: string]: unknown;
}

/**
 * Processes inbound request paths.
 *
 * Port of `Drupal\Core\PathProcessor\InboundPathProcessorInterface`.
 */
export interface InboundPathProcessorInterface {
  /** Processes the inbound path, returning the resolved system path. */
  processInbound(path: string, request: RequestLike): string;
}

/**
 * Processes outbound paths.
 *
 * Port of `Drupal\Core\PathProcessor\OutboundPathProcessorInterface`.
 */
export interface OutboundPathProcessorInterface {
  /** Processes the outbound path, returning the aliased path. */
  processOutbound(
    path: string,
    options?: PathProcessorOptions,
    request?: RequestLike | null,
  ): string;
}
