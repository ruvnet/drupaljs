import { PluginNotFoundException } from '@drupaljs/plugin';
import { PluginRegistry } from '../plugin-registry.js';
import type {
  FieldDefinitionInterface,
  FormatterConstructor,
  FormatterInterface,
  FormatterPluginDefinition,
} from '../contracts.js';

/** Options passed when instantiating a formatter. */
export interface FormatterInstanceOptions {
  fieldDefinition: FieldDefinitionInterface;
  settings?: Record<string, unknown>;
  label?: string;
  viewMode?: string;
}

/**
 * Manages field formatter plugins.
 *
 * Port of `Drupal\Core\Field\FormatterPluginManager`. Formatters declare the
 * `field_types` they apply to; `getOptions()` filters the registry to those
 * compatible with a given field type (also honoring the plugin's static
 * `isApplicable()`).
 *
 * @see \Drupal\Core\Field\FormatterPluginManager
 */
export class FormatterPluginManager extends PluginRegistry<FormatterPluginDefinition> {
  /** Returns formatter definitions applicable to the given field type. */
  getOptions(fieldType: string): Record<string, FormatterPluginDefinition> {
    const result: Record<string, FormatterPluginDefinition> = {};
    for (const [id, definition] of Object.entries(this.getDefinitions())) {
      const fieldTypes = definition.field_types ?? [];
      if (fieldTypes.length === 0 || fieldTypes.includes(fieldType)) {
        result[id] = definition;
      }
    }
    return result;
  }

  /**
   * Creates a configured formatter instance.
   *
   * @see \Drupal\Core\Field\FormatterPluginManager::getInstance()
   */
  createInstance(pluginId: string, options: FormatterInstanceOptions): FormatterInterface {
    const definition = this.getDefinition(pluginId, false);
    if (!definition) {
      throw new PluginNotFoundException(pluginId);
    }
    const ctor = definition.class as FormatterConstructor;
    return new (ctor as unknown as new (
      pluginId: string,
      pluginDefinition: FormatterPluginDefinition,
      fieldDefinition: FieldDefinitionInterface,
      settings: Record<string, unknown>,
      label: string,
      viewMode: string,
    ) => FormatterInterface)(
      pluginId,
      definition,
      options.fieldDefinition,
      options.settings ?? {},
      options.label ?? '',
      options.viewMode ?? 'default',
    );
  }
}
