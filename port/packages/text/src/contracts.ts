/**
 * Public contracts for @drupaljs/text.
 *
 * These mirror Drupal core's text module field types, the TextProcessed
 * computed property and the processed-text / trimmed formatters. Ref:
 * core/modules/text.
 */

// TODO(@drupaljs/filter): replace these local minimal types with the real
// imports from `@drupaljs/filter` once that package lands. They model just the
// surface @drupaljs/text needs from the filter pipeline.

/**
 * Result of running text through the filter pipeline. Mirrors
 * Drupal\filter\FilterProcessResult (the bits text actually consumes).
 */
export interface FilterProcessResult {
  /** The processed (filtered) HTML markup. */
  readonly processedText: string;
  /** Cache tags bubbled up by the filters. */
  readonly cacheTags: string[];
  /** Cache contexts bubbled up by the filters. */
  readonly cacheContexts: string[];
  /** Max-age in seconds (-1 = permanent). */
  readonly cacheMaxAge: number;
}

/**
 * A single filter inside a format, as far as TextSummary cares about it.
 * Mirrors the `status`/id surface of Drupal\filter\Plugin\FilterInterface.
 */
export interface FilterInfo {
  readonly id: string;
  readonly status: boolean;
}

/**
 * Describes a configured filter format. Mirrors the slice of
 * Drupal\filter\Entity\FilterFormat used by text.
 */
export interface FilterFormat {
  readonly id: string;
  /** Returns the enabled/configured filters for this format. */
  filters(): FilterInfo[];
}

/**
 * The filter pipeline @drupaljs/text depends on. Mirrors the combination of
 * the `processed_text` render element and the FilterFormatRepository that
 * Drupal core uses. Injected so it can be mocked (TDD-London).
 */
export interface FilterPipeline {
  /**
   * Run text through a format's filter pipeline. Mirrors
   * `#type => 'processed_text'` rendering. A null/unknown format falls back to
   * the configured fallback format.
   */
  process(text: string, format: string | null, langcode?: string): FilterProcessResult;
  /** Load a configured format by id, or undefined if it does not exist. */
  getFormat(format: string): FilterFormat | undefined;
  /** The fallback format id (Drupal: filter_fallback_format()). */
  getFallbackFormatId(): string;
}

/** Field item value shape shared by all text field types. */
export interface TextItemValue {
  value: string | null;
  format: string | null;
  /** Only present on text_with_summary. */
  summary?: string | null;
}

/** Storage settings for the `text` (short) field type. */
export interface TextStorageSettings {
  max_length: number;
}

/** Field-level settings common to all text field types. */
export interface TextFieldSettings {
  allowed_formats: string[];
}

/** Additional field settings for text_with_summary. */
export interface TextWithSummaryFieldSettings extends TextFieldSettings {
  display_summary: boolean;
  required_summary: boolean;
}

/** A column descriptor in a field type's storage schema. */
export interface SchemaColumn {
  type: string;
  length?: number;
  size?: string;
}

/** Storage schema for a field type. Mirrors FieldItemInterface::schema(). */
export interface FieldSchema {
  columns: Record<string, SchemaColumn>;
  indexes: Record<string, string[]>;
}

/** A validation constraint descriptor (subset used by text). */
export interface Constraint {
  name: string;
  options: Record<string, unknown>;
}

/**
 * Static descriptor of a text field type plugin. Mirrors the data carried by
 * Drupal's #[FieldType] attribute plus the static schema/settings methods.
 */
export interface TextFieldTypeDefinition {
  readonly id: 'text' | 'text_long' | 'text_with_summary';
  readonly label: string;
  readonly category: string;
  readonly defaultWidget: string;
  readonly defaultFormatter: string;
  defaultStorageSettings(): Record<string, unknown>;
  defaultFieldSettings(): Record<string, unknown>;
  schema(settings: Record<string, unknown>): FieldSchema;
  /** Property names this field type exposes (value/format/processed/...). */
  propertyNames(): string[];
  /** Whether a given value is considered empty for this field type. */
  isEmpty(value: TextItemValue): boolean;
  /** Validation constraints derived from settings. */
  getConstraints(settings: Record<string, unknown>): Constraint[];
}
