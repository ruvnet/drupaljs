/**
 * Value object returned by a filter plugin's `process()` method.
 *
 * Carries the processed text plus bubbleable cacheability metadata (cache tags,
 * contexts, max-age) and attached asset libraries. This is the TS port of
 * `Drupal\filter\FilterProcessResult` (a `BubbleableMetadata` subclass); the
 * subset of metadata modeled here is what the filter pipeline needs to bubble.
 *
 * @see core/modules/filter/src/FilterProcessResult.php
 */
export class FilterProcessResult {
  /** Sentinel meaning "cache permanently" — never lowers another max-age. */
  static readonly CACHE_MAX_AGE_PERMANENT = Number.POSITIVE_INFINITY;

  private processedText: string;
  private readonly cacheTags = new Set<string>();
  private readonly cacheContexts = new Set<string>();
  private maxAge: number = FilterProcessResult.CACHE_MAX_AGE_PERMANENT;
  private readonly libraries = new Set<string>();

  constructor(processedText = '') {
    this.processedText = processedText;
  }

  /** Gets the processed text. */
  getProcessedText(): string {
    return this.processedText;
  }

  /** Sets the processed text. Chainable. */
  setProcessedText(processedText: string): this {
    this.processedText = processedText;
    return this;
  }

  /** Stringifies to the processed text. */
  toString(): string {
    return this.processedText;
  }

  /** Adds cache tags. Chainable. */
  addCacheTags(tags: readonly string[]): this {
    for (const t of tags) this.cacheTags.add(t);
    return this;
  }

  /** Returns the collected cache tags. */
  getCacheTags(): string[] {
    return [...this.cacheTags];
  }

  /** Adds cache contexts. Chainable. */
  addCacheContexts(contexts: readonly string[]): this {
    for (const c of contexts) this.cacheContexts.add(c);
    return this;
  }

  /** Returns the collected cache contexts. */
  getCacheContexts(): string[] {
    return [...this.cacheContexts];
  }

  /**
   * Sets the cache max-age, keeping the most restrictive (lowest) value. A
   * permanent (`Infinity`) value never lowers a finite one. Chainable.
   */
  setCacheMaxAge(maxAge: number): this {
    this.maxAge = Math.min(this.maxAge, maxAge);
    return this;
  }

  /** Returns the effective cache max-age. */
  getCacheMaxAge(): number {
    return this.maxAge;
  }

  /** Attaches an asset library. Chainable. */
  addAttachedLibrary(library: string): this {
    this.libraries.add(library);
    return this;
  }

  /** Returns the attached asset libraries. */
  getAttachedLibraries(): string[] {
    return [...this.libraries];
  }

  /**
   * Merges another result's cacheability metadata and libraries into this one
   * (the processed text is not merged). Chainable.
   */
  merge(other: FilterProcessResult): this {
    this.addCacheTags(other.getCacheTags());
    this.addCacheContexts(other.getCacheContexts());
    this.setCacheMaxAge(other.getCacheMaxAge());
    for (const lib of other.getAttachedLibraries()) this.libraries.add(lib);
    return this;
  }
}
