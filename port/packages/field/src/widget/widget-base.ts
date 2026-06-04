import { PluginSettingsBase } from '../plugin-settings-base.js';
import type { PluginDefinition } from '@drupaljs/plugin';
import type {
  FieldDefinitionInterface,
  FieldItemListInterface,
  RenderableArray,
  WidgetInterface,
} from '../contracts.js';

/**
 * Base class for field widget plugins.
 *
 * Port of `Drupal\Core\Field\WidgetBase`. Concrete widgets implement
 * `formElement()` for a single delta. `massageFormValues()` passes submitted
 * values through unchanged by default.
 *
 * @see \Drupal\Core\Field\WidgetInterface
 * @see \Drupal\Core\Field\WidgetBase
 */
export abstract class WidgetBase extends PluginSettingsBase implements WidgetInterface {
  constructor(
    pluginId: string,
    pluginDefinition: PluginDefinition,
    protected readonly fieldDefinition: FieldDefinitionInterface,
    settings: Record<string, unknown> = {},
  ) {
    super(pluginId, pluginDefinition, settings);
  }

  /** Returns whether the widget can be used for the provided field. */
  static isApplicable(_fieldDefinition: FieldDefinitionInterface): boolean {
    return true;
  }

  settingsSummary(): string[] {
    return [];
  }

  massageFormValues(
    values: Array<Record<string, unknown>>,
  ): Array<Record<string, unknown>> {
    return values;
  }

  abstract formElement(
    items: FieldItemListInterface,
    delta: number,
    element: RenderableArray,
  ): RenderableArray;
}
