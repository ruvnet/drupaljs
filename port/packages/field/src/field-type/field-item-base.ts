import type {
  ComplexDataDefinitionInterface,
  ConstraintViolation,
  DataDefinitionInterface,
  TraversableTypedDataInterface,
  TypedDataInterface,
} from '@drupaljs/typed-data';
import type {
  DisplayOptions,
  FieldDefinitionInterface,
  FieldItemInterface,
  FieldItemListInterface,
  FieldSchema,
  FieldStorageDefinitionInterface,
  FieldableEntityInterface,
  RenderableArray,
} from '../contracts.js';

/**
 * Base class for field type plugins (the "FieldType").
 *
 * Port of `Drupal\Core\Field\FieldItemBase`. A field item is a complex data
 * object holding one value of a field as a set of named properties. Subclasses
 * implement the static metadata (`propertyDefinitions`, `schema`,
 * `mainPropertyName`) and may override `isEmpty`.
 *
 * @see \Drupal\Core\Field\FieldItemBase
 * @see \Drupal\Core\Field\FieldItemInterface
 */
export abstract class FieldItemBase implements FieldItemInterface {
  /** Property values keyed by property name. */
  protected propertyValues: Record<string, unknown> = {};

  constructor(
    protected readonly definition: ComplexDataDefinitionInterface,
    protected name: string | number | null = null,
    protected parent: FieldItemListInterface | null = null,
  ) {}

  // -- Static metadata (overridden by concrete field types). -----------------

  static propertyDefinitions(
    _fieldDefinition: FieldStorageDefinitionInterface,
  ): Record<string, DataDefinitionInterface> {
    return {};
  }

  static mainPropertyName(): string | null {
    return 'value';
  }

  static schema(_fieldDefinition: FieldStorageDefinitionInterface): FieldSchema | Record<string, never> {
    return {};
  }

  static defaultStorageSettings(): Record<string, unknown> {
    return {};
  }

  static defaultFieldSettings(): Record<string, unknown> {
    return {};
  }

  static generateSampleValue(_fieldDefinition: FieldDefinitionInterface): Record<string, unknown> {
    return {};
  }

  // -- ComplexDataInterface ---------------------------------------------------

  getDataDefinition(): ComplexDataDefinitionInterface {
    return this.definition;
  }

  getValue(): Record<string, unknown> {
    return { ...this.propertyValues };
  }

  setValue(value: unknown, notify = true): void {
    if (value === null || value === undefined) {
      this.propertyValues = {};
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      this.propertyValues = { ...(value as Record<string, unknown>) };
    } else {
      // A scalar is assigned to the main property, mirroring FieldItemBase.
      const main = (this.constructor as typeof FieldItemBase).mainPropertyName();
      if (main === null) {
        throw new Error('A scalar cannot be set on a field item with no main property.');
      }
      this.propertyValues = { [main]: value };
    }
    if (notify) {
      this.parent?.onChange(this.name as string | number);
    }
  }

  get(propertyName: string): TypedDataInterface {
    return this.wrapProperty(propertyName);
  }

  set(propertyName: string, value: unknown, notify = true): this {
    this.propertyValues[propertyName] = value;
    if (notify) {
      this.parent?.onChange(this.name as string | number);
    }
    return this;
  }

  getProperties(_includeComputed = false): Record<string, TypedDataInterface> {
    const result: Record<string, TypedDataInterface> = {};
    for (const propertyName of Object.keys(this.definition.getPropertyDefinitions())) {
      result[propertyName] = this.wrapProperty(propertyName);
    }
    return result;
  }

  toArray(): Record<string, unknown> {
    return { ...this.propertyValues };
  }

  isEmpty(): boolean {
    const main = (this.constructor as typeof FieldItemBase).mainPropertyName();
    if (main !== null) {
      const value = this.propertyValues[main];
      return value === null || value === undefined || value === '';
    }
    return Object.values(this.propertyValues).every(
      (v) => v === null || v === undefined || v === '',
    );
  }

  // -- FieldItemInterface -----------------------------------------------------

  getEntity(): FieldableEntityInterface | null {
    return this.parent?.getEntity() ?? null;
  }

  getLangcode(): string | null {
    return this.parent?.getLangcode() ?? null;
  }

  getFieldDefinition(): FieldDefinitionInterface {
    if (!this.parent) {
      throw new Error('Field item is not attached to a field item list.');
    }
    return this.parent.getFieldDefinition();
  }

  getSettings(): Record<string, unknown> {
    return this.getFieldDefinition().getSettings();
  }

  getSetting(settingName: string): unknown {
    return this.getSettings()[settingName] ?? null;
  }

  view(_displayOptions: DisplayOptions | string = {}): RenderableArray {
    // TODO(@drupaljs/render): delegate to the entity view builder / formatter.
    return {};
  }

  preSave(): void {
    // No-op by default.
  }

  postSave(_update: boolean): boolean {
    return false;
  }

  delete(): void {
    // No-op by default.
  }

  deleteRevision(): void {
    // No-op by default.
  }

  // -- TypedDataInterface (minimal) ------------------------------------------

  getString(): string {
    const main = (this.constructor as typeof FieldItemBase).mainPropertyName();
    if (main !== null) {
      const value = this.propertyValues[main];
      return value === null || value === undefined ? '' : String(value);
    }
    return Object.values(this.propertyValues)
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v))
      .join(', ');
  }

  getConstraints(): Record<string, unknown> {
    return this.definition.getConstraints();
  }

  validate(): ConstraintViolation[] {
    // TODO(@drupaljs/validation): wire up real constraint validation.
    return [];
  }

  applyDefaultValue(_notify = true): this {
    this.setValue(null, false);
    return this;
  }

  getName(): string | number | null {
    return this.name;
  }

  getParent(): TraversableTypedDataInterface | null {
    return this.parent as unknown as TraversableTypedDataInterface | null;
  }

  getRoot(): TypedDataInterface {
    return (this.parent?.getRoot() ?? this) as TypedDataInterface;
  }

  getPropertyPath(): string {
    const parentPath = this.parent?.getPropertyPath() ?? '';
    if (parentPath !== '') {
      return `${parentPath}.${this.name}`;
    }
    return this.name === null ? '' : String(this.name);
  }

  setContext(
    name: string | number | null = null,
    parent: TraversableTypedDataInterface | null = null,
  ): void {
    this.name = name;
    this.parent = parent as unknown as FieldItemListInterface | null;
  }

  onChange(_name: string | number): void {
    this.parent?.onChange(this.name as string | number);
  }

  [Symbol.iterator](): Iterator<TypedDataInterface> {
    return Object.values(this.getProperties())[Symbol.iterator]();
  }

  /**
   * Wraps a stored property value in a minimal typed-data accessor. The full
   * typed-data property instantiation lives in @drupaljs/typed-data; here we
   * expose just enough to satisfy ComplexDataInterface::get().
   */
  protected wrapProperty(propertyName: string): TypedDataInterface {
    const item = this;
    const propertyDefinition =
      this.definition.getPropertyDefinition(propertyName) ?? null;
    return {
      getValue: () => item.propertyValues[propertyName] ?? null,
      setValue: (value: unknown, notify = true) => item.set(propertyName, value, notify),
      getString: () => {
        const v = item.propertyValues[propertyName];
        return v === null || v === undefined ? '' : String(v);
      },
      getDataDefinition: () => propertyDefinition as DataDefinitionInterface,
      getConstraints: () => propertyDefinition?.getConstraints() ?? {},
      validate: () => [],
      applyDefaultValue: function (this: TypedDataInterface) {
        item.set(propertyName, null);
        return this;
      },
      getName: () => propertyName,
      getParent: () => item as unknown as TraversableTypedDataInterface,
      getRoot: () => item.getRoot(),
      getPropertyPath: () => `${item.getPropertyPath()}.${propertyName}`,
      setContext: () => {},
    } as TypedDataInterface;
  }
}
