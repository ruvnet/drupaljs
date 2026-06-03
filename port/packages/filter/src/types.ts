/**
 * Core type contracts for the text-format filter pipeline.
 *
 * Port of `Drupal\filter\Plugin\FilterInterface` and the supporting value
 * shapes. A "text format" is an ordered group of filter plugins; user-submitted
 * content is run through that group (prepare pass, then process pass) before it
 * is emitted as HTML.
 *
 * @see core/modules/filter/src/Plugin/FilterInterface.php
 */

import type {
  PluginInspectionInterface,
  PluginDefinition,
} from '@drupaljs/plugin';
import type { FilterProcessResult } from './filter-process-result.js';

/**
 * Classification of a filter's purpose.
 *
 * Mirrors the `FilterInterface::TYPE_*` constants. Numeric values are kept
 * identical to Drupal so serialized config round-trips unchanged.
 */
export enum FilterType {
  /** Non-HTML markup language filters that generate HTML. */
  MARKUP_LANGUAGE = 0,
  /** HTML tag and attribute restricting filters to prevent XSS attacks. */
  HTML_RESTRICTOR = 1,
  /** Reversible transformation filters. */
  TRANSFORM_REVERSIBLE = 2,
  /** Irreversible transformation filters. */
  TRANSFORM_IRREVERSIBLE = 3,
}

/**
 * Per-instance configuration of a filter within a {@link FilterFormatConfig}.
 *
 * @see core/modules/filter/src/Plugin/FilterBase.php
 */
export interface FilterConfiguration {
  /** The plugin ID of the filter plugin instance. */
  id?: string;
  /** The provider (module) that owns the filter. */
  provider?: string;
  /** Whether the filter is enabled in the text format. Defaults to false. */
  status?: boolean;
  /** Weight of the filter in the text format. Lower runs first. Defaults to 0. */
  weight?: number;
  /** Configured settings for the filter instance. */
  settings?: Record<string, unknown>;
}

/**
 * Serializable configuration of a text format (the `filter.format.*` config
 * entity body).
 *
 * @see core/modules/filter/src/Entity/FilterFormat.php
 */
export interface FilterFormatConfig {
  /** Unique machine name of the format (the entity ID). */
  format: string;
  /** Human-readable label of the format. */
  name: string;
  /** Weight in the format selector. Defaults to 0. */
  weight?: number;
  /** Whether the format is enabled. Defaults to true when omitted. */
  status?: boolean;
  /**
   * Configured filters keyed by instance ID. Use {@link FilterFormat.filters}
   * to obtain the instantiated, weight-sorted plugins.
   */
  filters?: Record<string, FilterConfiguration>;
}

/**
 * The set of attribute values allowed for an attribute.
 *
 * - `true` — any value is allowed.
 * - `false` — the attribute is forbidden.
 * - a record — keys are attribute values (may use a `*` wildcard), `true`
 *   marks the value allowed, `false` forbidden.
 */
export type AttributeRestriction = boolean | Record<string, boolean>;

/**
 * HTML restrictions reported by a {@link FilterType.HTML_RESTRICTOR} filter.
 *
 * `false` means the filter applies no restrictions (any HTML allowed). The
 * `allowed` map is keyed by tag name; each value is:
 * - `true` — any attribute is allowed on the tag;
 * - `false` — no attributes are allowed;
 * - a record of attribute name → {@link AttributeRestriction}. The `*`
 *   pseudo-tag carries restrictions applied to all tags.
 *
 * @see core/modules/filter/src/Plugin/FilterInterface.php (getHTMLRestrictions)
 */
export type HtmlRestrictions =
  | false
  | { allowed: Record<string, boolean | Record<string, AttributeRestriction>> };

/**
 * Defines the interface for text processing filter plugins.
 *
 * @see core/modules/filter/src/Plugin/FilterInterface.php
 */
export interface FilterInterface extends PluginInspectionInterface {
  /** Provider (module) that owns this filter instance. */
  readonly provider: string;
  /** Whether this filter is enabled within its text format. */
  status: boolean;
  /** Weight relative to other filters in the format (lower runs first). */
  weight: number;
  /** Configured settings of this filter instance. */
  settings: Record<string, unknown>;

  /** Returns the processing {@link FilterType} of this plugin. */
  getType(): FilterType;

  /** Returns the administrative label. */
  getLabel(): string;

  /** Returns the administrative description (may be empty). */
  getDescription(): string;

  /** Returns the full per-instance configuration. */
  getConfiguration(): Required<FilterConfiguration>;

  /** Applies configuration to this instance, returning `this`. */
  setConfiguration(configuration: FilterConfiguration): this;

  /**
   * Escapes HTML-like structures prior to the process pass. Filters should use
   * this only for escaping. Default is a no-op (returns the text unchanged).
   */
  prepare(text: string, langcode: string): string;

  /** Performs the filter's transformation, returning a process result. */
  process(text: string, langcode: string): FilterProcessResult;

  /**
   * Returns the HTML allowed by this filter, or `false` for no restrictions.
   * Only meaningful for {@link FilterType.HTML_RESTRICTOR} filters.
   */
  getHtmlRestrictions(): HtmlRestrictions;

  /** Returns a short admin tip, or `null` if the filter has none. */
  tips(): string | null;
}

/**
 * Constructor signature for a filter plugin, matching the plugin factory's
 * `(configuration, pluginId, pluginDefinition)` contract.
 */
export type FilterConstructor = new (
  configuration: Record<string, unknown>,
  pluginId: string,
  pluginDefinition: PluginDefinition,
) => FilterInterface;
