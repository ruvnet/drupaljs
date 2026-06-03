/**
 * Core domain types for the locale string-translation subsystem.
 *
 * Port of select pieces of Drupal core/modules/locale:
 * - StringInterface / StringBase (source + translation strings)
 * - StringStorageInterface (storage + fast-query lookup)
 *
 * Cross-package collaborators (language manager, cache, lock) are not yet
 * published as @drupaljs/* packages, so the minimal contracts they need are
 * defined locally below and marked with TODO so they can be replaced once the
 * owning packages land.
 */

/**
 * A location pairs an arbitrary type (e.g. 'path', 'code', 'configuration')
 * with a name, recording where a source string was discovered.
 */
export interface StringLocation {
  readonly type: string;
  readonly name: string;
}

/**
 * Field conditions used to filter strings in storage queries.
 *
 * Mirrors Drupal's loosely-typed `$conditions` array but typed to the fields
 * the in-memory storage understands.
 */
export interface StringConditions {
  /** String identifier (lid). */
  lid?: number;
  /** Source string text. */
  source?: string;
  /** msgctxt context. Empty string means "no context". */
  context?: string;
  /** Language code (translations only). */
  language?: string;
  /**
   * When set, restricts to translated (true) or untranslated (false) strings.
   * When omitted, both are returned.
   */
  translated?: boolean;
  /** Whether the translation was customized by a user. */
  customized?: boolean;
}

/**
 * Initial values used to construct a string object.
 */
export interface StringValues {
  lid?: number;
  source?: string;
  context?: string;
  version?: string;
  language?: string;
  translation?: string;
  customized?: boolean;
}

/**
 * The locale string interface — common to source and translation strings.
 *
 * Port of \Drupal\locale\StringInterface (trimmed to the members exercised by
 * storage + lookup; plural/Po serialization is deferred to the WASM gettext
 * crate per ADR-0015).
 */
export interface StringInterface {
  getId(): number | undefined;
  setId(lid: number): this;

  getVersion(): string | undefined;
  setVersion(version: string): this;

  getString(): string;
  setString(value: string): this;

  isNew(): boolean;
  isSource(): boolean;
  isTranslation(): boolean;

  setValues(values: StringValues, override?: boolean): this;
  getValues<K extends keyof StringValues>(fields: readonly K[]): Pick<StringValues, K>;

  getLocations(): readonly StringLocation[];
  addLocation(type: string, name: string): this;
  hasLocation(type: string, name: string): boolean;
}

/**
 * The locale string storage interface.
 *
 * Port of \Drupal\locale\StringStorageInterface (trimmed: import/export,
 * location persistence, and pager options are out of scope for the in-memory
 * interface storage). `findTranslation` is the hot path used by LocaleLookup.
 */
export interface StringStorageInterface {
  /** Loads source string objects matching the conditions. */
  getStrings(conditions?: StringConditions): StringInterface[];

  /** Loads translation string objects matching the conditions. */
  getTranslations(conditions?: StringConditions): StringInterface[];

  /** Fast query: loads a single source string, or undefined. */
  findString(conditions: StringConditions): StringInterface | undefined;

  /** Fast query: loads a single translation string, or undefined. */
  findTranslation(conditions: StringConditions): StringInterface | undefined;

  /** Persists a source or translation string. Returns the storage. */
  save(string: StringInterface): this;

  /** Removes a string from storage. Returns the storage. */
  delete(string: StringInterface): this;

  /** Deletes source strings (and their translations) by condition. */
  deleteStrings(conditions: StringConditions): this;

  /** Deletes translations by condition. */
  deleteTranslations(conditions: StringConditions): this;

  /** Counts source strings. */
  countStrings(): number;

  /** Counts translations per language code. */
  countTranslations(): Record<string, number>;

  /** Creates an unsaved source string bound to this storage. */
  createString(values?: StringValues): StringInterface;

  /** Creates an unsaved translation string bound to this storage. */
  createTranslation(values?: StringValues): StringInterface;
}

/**
 * Minimal language-fallback contract needed by LocaleLookup.
 *
 * TODO(@drupaljs/language): replace with the real LanguageManagerInterface
 * once that package exports it. We only need fallback-candidate resolution.
 */
export interface LanguageFallbackProvider {
  /**
   * Returns the ordered list of fallback language codes to try when a
   * translation is missing for the requested language.
   */
  getFallbackCandidates(langcode: string): readonly string[];
}
