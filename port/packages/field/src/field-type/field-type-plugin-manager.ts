import { PluginNotFoundException } from '@drupaljs/plugin';
import { PluginRegistry } from '../plugin-registry.js';
import { FieldStorageDefinition } from '../field-storage-definition.js';
import { FieldDefinition } from '../field-definition.js';
import { FieldItemList } from './field-item-list.js';
import type {
  FieldDefinitionInterface,
  FieldItemConstructor,
  FieldItemInterface,
  FieldItemListInterface,
  FieldStorageDefinitionInterface,
  FieldTypePluginDefinition,
  FieldableEntityInterface,
} from '../contracts.js';

/**
 * Manages field type plugins and instantiates field item lists/items.
 *
 * Port of `Drupal\Core\Field\FieldTypePluginManager`. Field type plugins are
 * registered by ID with their FieldItem constructor (the "FieldType" class) and
 * default widget/formatter. Default settings are read from the item class's
 * static `defaultStorageSettings()` / `defaultFieldSettings()`.
 *
 * @see \Drupal\Core\Field\FieldTypePluginManagerInterface
 */
export class FieldTypePluginManager extends PluginRegistry<FieldTypePluginDefinition> {
  /** Returns the FieldItem constructor implementing the given field type. */
  getPluginClass(type: string): FieldItemConstructor {
    const definition = this.getDefinition(type, false);
    if (!definition) {
      throw new PluginNotFoundException(type);
    }
    return definition.class;
  }

  getDefaultStorageSettings(type: string): Record<string, unknown> {
    return this.getPluginClass(type).defaultStorageSettings();
  }

  getDefaultFieldSettings(type: string): Record<string, unknown> {
    return this.getPluginClass(type).defaultFieldSettings();
  }

  /** Field type definitions that are addable via UI (no_ui not set). */
  getUiDefinitions(): Record<string, FieldTypePluginDefinition> {
    const result: Record<string, FieldTypePluginDefinition> = {};
    for (const [id, definition] of Object.entries(this.getDefinitions())) {
      if (!definition.no_ui) {
        result[id] = definition;
      }
    }
    return result;
  }

  /**
   * Creates a new field item list bound to the given entity.
   *
   * @see \Drupal\Core\Field\FieldTypePluginManagerInterface::createFieldItemList()
   */
  createFieldItemList(
    fieldDefinition: FieldDefinitionInterface,
    entity: FieldableEntityInterface | null = null,
    values: unknown = null,
  ): FieldItemListInterface {
    const itemClass = this.getPluginClass(fieldDefinition.getType());
    const list = new FieldItemList(fieldDefinition, itemClass, fieldDefinition.getName(), entity);
    if (values !== null && values !== undefined) {
      list.setValue(values, false);
    }
    return list;
  }

  /**
   * Creates a new field item as part of a field item list at the given index.
   *
   * @see \Drupal\Core\Field\FieldTypePluginManagerInterface::createFieldItem()
   */
  createFieldItem(
    items: FieldItemListInterface,
    index: number,
    values: unknown = null,
  ): FieldItemInterface {
    const item = items.appendItem();
    if (values !== null && values !== undefined) {
      item.setValue(values, false);
    }
    void index;
    return item;
  }

  /**
   * Builds a {@link FieldStorageDefinition} for the given field type, wiring in
   * the registered FieldItem class so property/schema metadata can be derived.
   */
  createFieldStorageDefinition(
    name: string,
    type: string,
    entityTypeId: string,
    overrides: Partial<{
      settings: Record<string, unknown>;
      cardinality: number;
      translatable: boolean;
      label: string;
    }> = {},
  ): FieldStorageDefinitionInterface {
    return new FieldStorageDefinition({
      name,
      type,
      entityTypeId,
      itemClass: this.getPluginClass(type),
      ...overrides,
    });
  }

  /** Builds a {@link FieldDefinition} from a storage definition for a bundle. */
  createFieldDefinition(
    storageDefinition: FieldStorageDefinitionInterface,
    bundle: string | null = null,
    overrides: Partial<{ label: string; required: boolean }> = {},
  ): FieldDefinitionInterface {
    return FieldDefinition.createFromStorageDefinition(storageDefinition, {
      bundle,
      ...overrides,
    });
  }
}
