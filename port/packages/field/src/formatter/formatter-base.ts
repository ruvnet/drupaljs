import { PluginSettingsBase } from '../plugin-settings-base.js';
import type { PluginDefinition } from '@drupaljs/plugin';
import type {
  FieldDefinitionInterface,
  FieldItemListInterface,
  FormatterInterface,
  RenderableArray,
} from '../contracts.js';

/**
 * Base class for field formatter plugins.
 *
 * Port of `Drupal\Core\Field\FormatterBase`. Concrete formatters implement
 * `viewElements()`; `view()` wraps the per-value elements. Applicability
 * defaults to "applies to any field" and is overridden via the static
 * `isApplicable()`.
 *
 * @see \Drupal\Core\Field\FormatterInterface
 * @see \Drupal\Core\Field\FormatterBase
 */
export abstract class FormatterBase extends PluginSettingsBase implements FormatterInterface {
  constructor(
    pluginId: string,
    pluginDefinition: PluginDefinition,
    protected readonly fieldDefinition: FieldDefinitionInterface,
    settings: Record<string, unknown> = {},
    protected readonly label = '',
    protected readonly viewMode = 'default',
  ) {
    super(pluginId, pluginDefinition, settings);
  }

  /** Returns whether the formatter can be used for the provided field. */
  static isApplicable(_fieldDefinition: FieldDefinitionInterface): boolean {
    return true;
  }

  settingsSummary(): string[] {
    return [];
  }

  prepareView(_entitiesItems: FieldItemListInterface[]): void {
    // No-op by default.
  }

  view(items: FieldItemListInterface, langcode: string | null = null): RenderableArray {
    const elements = this.viewElements(items, langcode ?? items.getLangcode() ?? 'und');
    return {
      '#theme': 'field',
      '#field_name': this.fieldDefinition.getName(),
      '#field_type': this.fieldDefinition.getType(),
      '#label_display': this.label,
      '#view_mode': this.viewMode,
      '#items': items,
      ...elements.reduce<Record<number, RenderableArray>>((acc, el, delta) => {
        acc[delta] = el;
        return acc;
      }, {}),
    };
  }

  abstract viewElements(items: FieldItemListInterface, langcode: string): RenderableArray[];
}
