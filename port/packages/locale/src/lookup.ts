import type {
  LanguageFallbackProvider,
  StringStorageInterface,
} from './types.js';

/**
 * Resolves translated strings for a single (language, context) pair, caching
 * results in memory.
 *
 * Port of \Drupal\locale\LocaleLookup (a CacheCollector). The Drupal version
 * layers a persistent cache backend, a lock, and per-role cache keys on top;
 * those collaborators are not yet ported, so this keeps a simple per-instance
 * cache and the core resolution algorithm: look up the translation, fall back
 * across candidate languages, and record unknown source strings.
 *
 * The resolved value is either the translated string or, when no translation
 * exists, the original source `offset` (matching how `t()` returns the source
 * text untranslated).
 */
export class LocaleLookup {
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly langcode: string,
    private readonly context: string,
    private readonly stringStorage: StringStorageInterface,
    private readonly languageManager: LanguageFallbackProvider,
  ) {}

  /**
   * Returns the translation for `offset`, or the source string itself when no
   * translation is available. Results are memoized per instance.
   */
  get(offset: string): string {
    const cached = this.cache.get(offset);
    if (cached !== undefined) return cached;
    const value = this.resolveCacheMiss(offset);
    this.cache.set(offset, value);
    return value;
  }

  /** Port of LocaleLookup::resolveCacheMiss(). */
  private resolveCacheMiss(offset: string): string {
    const translation = this.stringStorage.findTranslation({
      source: offset,
      context: this.context,
      language: this.langcode,
    });

    let value: string | undefined =
      translation && translation.getString() !== '' ? translation.getString() : undefined;

    if (value === undefined) {
      // Record the (so far) untranslated source string, as Drupal does when
      // it updates {locales_source} to indicate the string is in use.
      if (!this.stringStorage.findString({ source: offset, context: this.context })) {
        const created = this.stringStorage
          .createString({ source: offset, context: this.context })
          .addLocation('code', 'locale-lookup');
        this.stringStorage.save(created);
      }

      // Try language fallback candidates in order.
      for (const fallbackLang of this.languageManager.getFallbackCandidates(this.langcode)) {
        const fallback = this.stringStorage.findTranslation({
          source: offset,
          context: this.context,
          language: fallbackLang,
        });
        if (fallback && fallback.getString() !== '') {
          value = fallback.getString();
          break;
        }
      }
    }

    // No translation anywhere: return the source text itself.
    return value ?? offset;
  }
}
