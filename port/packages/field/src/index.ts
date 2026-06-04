/**
 * @drupaljs/field — TypeScript port of Drupal's Field API.
 *
 * Ports `Drupal\Core\Field` (Drupal 11 core): the field item / item-list typed
 * data contracts (`FieldItemInterface`, `FieldItemListInterface`), the field
 * type base class (`FieldItemBase`), field + field storage definitions, and the
 * formatter & widget plugin registries built on `@drupaljs/plugin`.
 *
 * @see ADR-0014 (monorepo), ADR-0016 (TDD/Vitest), ADR-0017 (package ownership)
 * @see core/lib/Drupal/Core/Field
 */

// Constants.
export { CARDINALITY_UNLIMITED } from './contracts.js';

// Contracts / interfaces.
export type {
  AccessResultInterface,
  AccountInterface,
  DisplayContext,
  DisplayOptions,
  FieldableEntityInterface,
  FieldDefinitionInterface,
  FieldItemConstructor,
  FieldItemInterface,
  FieldItemListInterface,
  FieldSchema,
  FieldStorageDefinitionInterface,
  FieldTypePluginDefinition,
  FormatterConstructor,
  FormatterInterface,
  FormatterPluginDefinition,
  PluginSettingsConstructor,
  PluginSettingsInterface,
  RenderableArray,
  SchemaColumn,
  WidgetConstructor,
  WidgetInterface,
  WidgetPluginDefinition,
} from './contracts.js';

// Exceptions.
export { FieldException } from './exception.js';

// Definitions.
export {
  FieldStorageDefinition,
  type FieldStorageDefinitionValues,
} from './field-storage-definition.js';
export {
  FieldDefinition,
  type FieldDefinitionValues,
} from './field-definition.js';

// Field type (FieldType base + runtime list).
export { FieldItemBase } from './field-type/field-item-base.js';
export { FieldItemList } from './field-type/field-item-list.js';
export { FieldItemDataDefinition } from './field-type/field-item-data-definition.js';
export { FieldTypePluginManager } from './field-type/field-type-plugin-manager.js';

// Plugin settings base + registry backbone.
export { PluginSettingsBase } from './plugin-settings-base.js';
export { PluginRegistry } from './plugin-registry.js';

// Formatter plugin API.
export { FormatterBase } from './formatter/formatter-base.js';
export {
  FormatterPluginManager,
  type FormatterInstanceOptions,
} from './formatter/formatter-plugin-manager.js';

// Widget plugin API.
export { WidgetBase } from './widget/widget-base.js';
export {
  WidgetPluginManager,
  type WidgetInstanceOptions,
} from './widget/widget-plugin-manager.js';
