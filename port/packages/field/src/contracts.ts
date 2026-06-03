/**
 * Public contracts for the Field API.
 *
 * Ported from `Drupal\Core\Field` (Drupal 11 core). PHP relies on magic
 * accessors (`__get`/`__set`) and `Traversable`; in TS those become explicit
 * `get`/`set` methods inherited from the Typed Data contracts plus a `value`
 * convenience accessor on the list. Form/render/entity/account types from
 * subsystems not yet ported are represented by minimal local aliases marked
 * with a TODO.
 *
 * @see core/lib/Drupal/Core/Field
 */

import type {
  ComplexDataInterface,
  ComplexDataDefinitionInterface,
  DataDefinitionInterface,
  ListDataDefinitionInterface,
  ListInterface,
  TypedDataInterface,
} from '@drupaljs/typed-data';
import type { PluginInspectionInterface } from '@drupaljs/plugin';

/**
 * Base shape shared by the field plugin definitions.
 *
 * Field plugin definitions reference their implementation via a typed
 * constructor (FieldItem/Formatter/Widget) rather than the generic
 * {@link PluginDefinition} `class` union, so they are modeled standalone but
 * remain structurally compatible with the plugin registry (`id` + open keys).
 */
export interface FieldPluginDefinitionBase {
  id: string;
  [key: string]: unknown;
}

/**
 * Value indicating a field accepts an unlimited number of values.
 *
 * Mirrors `FieldStorageDefinitionInterface::CARDINALITY_UNLIMITED`.
 */
export const CARDINALITY_UNLIMITED = -1;

/**
 * A renderable array.
 *
 * TODO(@drupaljs/render): replace with the real render-array contract once the
 * render package exposes one. For now this is an open record.
 */
export type RenderableArray = Record<string, unknown>;

/**
 * Display context for a field — either the view (formatter) or form (widget).
 */
export type DisplayContext = 'view' | 'form';

/**
 * Display options for a field in a given context.
 *
 * @see FieldDefinitionInterface::getDisplayOptions()
 */
export interface DisplayOptions {
  label?: 'inline' | 'above' | 'hidden';
  region?: string;
  type?: string;
  settings?: Record<string, unknown>;
  third_party_settings?: Record<string, unknown>;
  weight?: number;
  [key: string]: unknown;
}

/**
 * A column specification within a field schema.
 *
 * TODO(@drupaljs/database): replace with the Schema API column contract once
 * the database package lands.
 */
export interface SchemaColumn {
  type: string;
  [key: string]: unknown;
}

/**
 * The schema returned by a field type plugin's `schema()`.
 *
 * @see FieldItemInterface::schema()
 */
export interface FieldSchema {
  columns: Record<string, SchemaColumn>;
  'unique keys'?: Record<string, string[]>;
  indexes?: Record<string, string[]>;
  'foreign keys'?: Record<string, unknown>;
}

/**
 * Minimal account contract used for field access checks.
 *
 * TODO(@drupaljs/session): replace with the real AccountInterface.
 */
export interface AccountInterface {
  id(): string | number;
}

/**
 * Minimal access-result contract.
 *
 * TODO(@drupaljs/access): replace with the real AccessResultInterface.
 */
export interface AccessResultInterface {
  isAllowed(): boolean;
}

/**
 * Minimal fieldable-entity contract a field item list belongs to.
 *
 * TODO(@drupaljs/entity): replace with the real FieldableEntityInterface.
 */
export interface FieldableEntityInterface {
  getEntityTypeId(): string;
  bundle(): string;
}

/**
 * Interface for entity field storage definitions.
 *
 * Defines how the field is stored, independent of entity bundle.
 *
 * @see \Drupal\Core\Field\FieldStorageDefinitionInterface
 */
export interface FieldStorageDefinitionInterface {
  getName(): string;
  getType(): string;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  isTranslatable(): boolean;
  setTranslatable(translatable: boolean): this;
  isRevisionable(): boolean;
  getLabel(): string;
  getDescription(): string | null;
  isMultiple(): boolean;
  getCardinality(): number;
  getPropertyDefinition(name: string): DataDefinitionInterface | null;
  getPropertyDefinitions(): Record<string, DataDefinitionInterface>;
  getPropertyNames(): string[];
  getMainPropertyName(): string | null;
  getTargetEntityTypeId(): string;
  getSchema(): FieldSchema | Record<string, never>;
  getColumns(): Record<string, SchemaColumn>;
  getProvider(): string | null;
  hasCustomStorage(): boolean;
  isBaseField(): boolean;
  getUniqueStorageIdentifier(): string;
  isDeleted(): boolean;
}

/**
 * Defines an interface for entity field definitions.
 *
 * A field definition returns information *about* a field (type, settings,
 * cardinality, display) rather than its values.
 *
 * @see \Drupal\Core\Field\FieldDefinitionInterface
 */
export interface FieldDefinitionInterface extends ListDataDefinitionInterface {
  getName(): string;
  getType(): string;
  getTargetEntityTypeId(): string | null;
  getTargetBundle(): string | null;
  isDisplayConfigurable(displayContext: DisplayContext): boolean;
  getDisplayOptions(displayContext: DisplayContext): DisplayOptions | null;
  isRequired(): boolean;
  isTranslatable(): boolean;
  getDefaultValueLiteral(): Array<Record<string, unknown>>;
  getDefaultValueCallback(): string | null;
  getDefaultValue(entity: FieldableEntityInterface): Array<Record<string, unknown>>;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  getFieldStorageDefinition(): FieldStorageDefinitionInterface;
  getUniqueIdentifier(): string;
}

/**
 * Interface for entity field items (a single value of a field).
 *
 * Field items are complex typed-data objects holding the field's properties.
 *
 * @see \Drupal\Core\Field\FieldItemInterface
 */
export interface FieldItemInterface extends ComplexDataInterface {
  getEntity(): FieldableEntityInterface | null;
  getLangcode(): string | null;
  getFieldDefinition(): FieldDefinitionInterface;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  view(displayOptions?: DisplayOptions | string): RenderableArray;
  preSave(): void;
  postSave(update: boolean): boolean;
  delete(): void;
  deleteRevision(): void;
}

/**
 * Static side of a field type plugin (the "FieldType" class object).
 *
 * In Drupal these are static methods on the FieldItem class. In TS they live on
 * the constructor so the plugin manager can call them before instantiation.
 *
 * @see \Drupal\Core\Field\FieldItemInterface (static methods)
 */
export interface FieldItemConstructor {
  new (
    definition: ComplexDataDefinitionInterface,
    name?: string | number | null,
    parent?: FieldItemListInterface | null,
  ): FieldItemInterface;
  propertyDefinitions(
    fieldDefinition: FieldStorageDefinitionInterface,
  ): Record<string, DataDefinitionInterface>;
  mainPropertyName(): string | null;
  schema(fieldDefinition: FieldStorageDefinitionInterface): FieldSchema | Record<string, never>;
  defaultStorageSettings(): Record<string, unknown>;
  defaultFieldSettings(): Record<string, unknown>;
  generateSampleValue(
    fieldDefinition: FieldDefinitionInterface,
  ): Record<string, unknown>;
}

/**
 * Interface for fields, being lists of field items.
 *
 * @see \Drupal\Core\Field\FieldItemListInterface
 */
export interface FieldItemListInterface extends ListInterface {
  /** Narrowed list accessors: items are always {@link FieldItemInterface}. */
  get(index: number): FieldItemInterface | null;
  first(): FieldItemInterface | null;
  last(): FieldItemInterface | null;
  appendItem(value?: unknown): FieldItemInterface;
  getEntity(): FieldableEntityInterface | null;
  setLangcode(langcode: string): void;
  getLangcode(): string | null;
  getFieldDefinition(): FieldDefinitionInterface;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  defaultAccess(operation?: string, account?: AccountInterface | null): AccessResultInterface;
  filterEmptyItems(): this;
  /** Convenience accessor for the first item's main property value. */
  readonly value: unknown;
  preSave(): void;
  postSave(update: boolean): boolean;
  delete(): void;
  deleteRevision(): void;
  view(displayOptions?: DisplayOptions | string): RenderableArray;
  equals(listToCompare: FieldItemListInterface): boolean;
}

/**
 * Interface for plugins with settings (formatters and widgets).
 *
 * @see \Drupal\Core\Field\PluginSettingsInterface
 */
export interface PluginSettingsInterface extends PluginInspectionInterface {
  getSettings(): Record<string, unknown>;
  getSetting(key: string): unknown;
  setSettings(settings: Record<string, unknown>): this;
  setSetting(key: string, value: unknown): this;
  getThirdPartySetting(provider: string, key: string, defaultValue?: unknown): unknown;
  setThirdPartySetting(provider: string, key: string, value: unknown): this;
  onDependencyRemoval(dependencies: Record<string, string[]>): boolean;
}

/**
 * Static side of a settings-bearing plugin.
 */
export interface PluginSettingsConstructor {
  defaultSettings(): Record<string, unknown>;
}

/**
 * Interface for field formatter plugins.
 *
 * @see \Drupal\Core\Field\FormatterInterface
 */
export interface FormatterInterface extends PluginSettingsInterface {
  settingsSummary(): string[];
  prepareView(entitiesItems: FieldItemListInterface[]): void;
  view(items: FieldItemListInterface, langcode?: string | null): RenderableArray;
  viewElements(items: FieldItemListInterface, langcode: string): RenderableArray[];
}

/** Static side of a formatter plugin. */
export interface FormatterConstructor extends PluginSettingsConstructor {
  new (...args: never[]): FormatterInterface;
  isApplicable(fieldDefinition: FieldDefinitionInterface): boolean;
}

/**
 * Interface for field widget plugins.
 *
 * @see \Drupal\Core\Field\WidgetInterface
 */
export interface WidgetInterface extends PluginSettingsInterface {
  settingsSummary(): string[];
  formElement(
    items: FieldItemListInterface,
    delta: number,
    element: RenderableArray,
  ): RenderableArray;
  massageFormValues(values: Array<Record<string, unknown>>): Array<Record<string, unknown>>;
}

/** Static side of a widget plugin. */
export interface WidgetConstructor extends PluginSettingsConstructor {
  new (...args: never[]): WidgetInterface;
  isApplicable(fieldDefinition: FieldDefinitionInterface): boolean;
}

/**
 * A field-type plugin definition.
 *
 * @see \Drupal\Core\Field\Attribute\FieldType
 */
export interface FieldTypePluginDefinition extends FieldPluginDefinitionBase {
  label?: string;
  description?: string;
  category?: string;
  /** The FieldItem implementation constructor. */
  class: FieldItemConstructor;
  default_widget?: string;
  default_formatter?: string;
  /** Whether the field type provides a UI-addable option. */
  no_ui?: boolean;
  cardinality?: number;
}

/**
 * A formatter plugin definition.
 *
 * @see \Drupal\Core\Field\Attribute\FieldFormatter
 */
export interface FormatterPluginDefinition extends FieldPluginDefinitionBase {
  label?: string;
  class: FormatterConstructor;
  /** Field types this formatter applies to. */
  field_types?: string[];
}

/**
 * A widget plugin definition.
 *
 * @see \Drupal\Core\Field\Attribute\FieldWidget
 */
export interface WidgetPluginDefinition extends FieldPluginDefinitionBase {
  label?: string;
  class: WidgetConstructor;
  /** Field types this widget applies to. */
  field_types?: string[];
}

export type { TypedDataInterface };
