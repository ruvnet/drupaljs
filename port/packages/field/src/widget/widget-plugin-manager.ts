import { PluginNotFoundException } from '@drupaljs/plugin';
import { PluginRegistry } from '../plugin-registry.js';
import type {
  FieldDefinitionInterface,
  WidgetConstructor,
  WidgetInterface,
  WidgetPluginDefinition,
} from '../contracts.js';

/** Options passed when instantiating a widget. */
export interface WidgetInstanceOptions {
  fieldDefinition: FieldDefinitionInterface;
  settings?: Record<string, unknown>;
}

/**
 * Manages field widget plugins.
 *
 * Port of `Drupal\Core\Field\WidgetPluginManager`. Widgets declare the
 * `field_types` they apply to; `getOptions()` filters to those compatible with
 * a given field type.
 *
 * @see \Drupal\Core\Field\WidgetPluginManager
 */
export class WidgetPluginManager extends PluginRegistry<WidgetPluginDefinition> {
  /** Returns widget definitions applicable to the given field type. */
  getOptions(fieldType: string): Record<string, WidgetPluginDefinition> {
    const result: Record<string, WidgetPluginDefinition> = {};
    for (const [id, definition] of Object.entries(this.getDefinitions())) {
      const fieldTypes = definition.field_types ?? [];
      if (fieldTypes.length === 0 || fieldTypes.includes(fieldType)) {
        result[id] = definition;
      }
    }
    return result;
  }

  /**
   * Creates a configured widget instance.
   *
   * @see \Drupal\Core\Field\WidgetPluginManager::getInstance()
   */
  createInstance(pluginId: string, options: WidgetInstanceOptions): WidgetInterface {
    const definition = this.getDefinition(pluginId, false);
    if (!definition) {
      throw new PluginNotFoundException(pluginId);
    }
    const ctor = definition.class as WidgetConstructor;
    return new (ctor as unknown as new (
      pluginId: string,
      pluginDefinition: WidgetPluginDefinition,
      fieldDefinition: FieldDefinitionInterface,
      settings: Record<string, unknown>,
    ) => WidgetInterface)(
      pluginId,
      definition,
      options.fieldDefinition,
      options.settings ?? {},
    );
  }
}
