import { PluginBase, type PluginDefinition } from '@drupaljs/plugin';
import type { FilterProcessResult } from './filter-process-result.js';
import {
  FilterType,
  type FilterConfiguration,
  type FilterInterface,
  type HtmlRestrictions,
} from './types.js';

/**
 * Base class for filter plugins.
 *
 * Port of `Drupal\filter\Plugin\FilterBase`. Reads label/description/type from
 * the plugin definition and tracks per-instance `status`/`weight`/`settings`.
 * Subclasses must implement {@link process}; everything else has a sensible
 * default (prepare = identity, no HTML restrictions, no tip).
 *
 * @see core/modules/filter/src/Plugin/FilterBase.php
 */
export abstract class FilterBase
  extends PluginBase
  implements FilterInterface
{
  readonly provider: string;
  status = false;
  weight = 0;
  settings: Record<string, unknown> = {};

  constructor(
    configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: PluginDefinition,
  ) {
    super(configuration, pluginId, pluginDefinition);
    this.provider = String(pluginDefinition.provider ?? '');
    this.setConfiguration(configuration as FilterConfiguration);
  }

  setConfiguration(configuration: FilterConfiguration): this {
    if (configuration.status !== undefined) {
      this.status = Boolean(configuration.status);
    }
    if (configuration.weight !== undefined) {
      this.weight = Number(configuration.weight);
    }
    if (configuration.settings !== undefined) {
      this.settings = { ...configuration.settings };
    }
    return this;
  }

  getConfiguration(): Required<FilterConfiguration> {
    return {
      id: this.getPluginId(),
      provider: this.provider,
      status: this.status,
      weight: this.weight,
      settings: this.settings,
    };
  }

  getType(): FilterType {
    return (this.pluginDefinition.type as FilterType) ?? FilterType.HTML_RESTRICTOR;
  }

  getLabel(): string {
    return String(this.pluginDefinition.title ?? '');
  }

  getDescription(): string {
    return String(this.pluginDefinition.description ?? '');
  }

  prepare(text: string, _langcode: string): string {
    return text;
  }

  abstract process(text: string, langcode: string): FilterProcessResult;

  getHtmlRestrictions(): HtmlRestrictions {
    return false;
  }

  tips(): string | null {
    return null;
  }
}
