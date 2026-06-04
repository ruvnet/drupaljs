import { ListDataDefinition } from '@drupaljs/typed-data';
import type { DataDefinitionInterface } from '@drupaljs/typed-data';
import { FieldException } from './exception.js';
import { CARDINALITY_UNLIMITED } from './contracts.js';
import type {
  FieldItemConstructor,
  FieldSchema,
  FieldStorageDefinitionInterface,
  SchemaColumn,
} from './contracts.js';

/** Mutable backing values for a {@link FieldStorageDefinition}. */
export interface FieldStorageDefinitionValues {
  name: string;
  type: string;
  /** The FieldItem implementation, used to resolve property/schema metadata. */
  itemClass: FieldItemConstructor;
  entityTypeId: string;
  settings?: Record<string, unknown>;
  cardinality?: number;
  translatable?: boolean;
  revisionable?: boolean;
  label?: string;
  description?: string | null;
  provider?: string | null;
  customStorage?: boolean;
  baseField?: boolean;
  deleted?: boolean;
}

/**
 * A field storage definition built in code (as opposed to configuration).
 *
 * Port of the storage-level concerns of `Drupal\Core\Field\BaseFieldDefinition`
 * / `FieldStorageDefinitionInterface`. Property and schema metadata are derived
 * by delegating to the field type's static `propertyDefinitions()` / `schema()`.
 *
 * @see \Drupal\Core\Field\FieldStorageDefinitionInterface
 */
export class FieldStorageDefinition implements FieldStorageDefinitionInterface {
  protected values: FieldStorageDefinitionValues;
  private propertyDefinitionsCache: Record<string, DataDefinitionInterface> | null = null;

  constructor(values: FieldStorageDefinitionValues) {
    if (!values.name) {
      throw new FieldException('A field storage definition requires a name.');
    }
    if (!values.type) {
      throw new FieldException(`Missing field type for storage "${values.name}".`);
    }
    this.values = { ...values };
  }

  /** Convenience factory mirroring `BaseFieldDefinition::create()`. */
  static create(values: FieldStorageDefinitionValues): FieldStorageDefinition {
    return new this(values);
  }

  getName(): string {
    return this.values.name;
  }

  getType(): string {
    return this.values.type;
  }

  getSettings(): Record<string, unknown> {
    return {
      ...this.values.itemClass.defaultStorageSettings(),
      ...(this.values.settings ?? {}),
    };
  }

  getSetting(settingName: string): unknown {
    return this.getSettings()[settingName] ?? null;
  }

  isTranslatable(): boolean {
    return Boolean(this.values.translatable);
  }

  setTranslatable(translatable: boolean): this {
    this.values.translatable = translatable;
    return this;
  }

  isRevisionable(): boolean {
    return Boolean(this.values.revisionable);
  }

  getLabel(): string {
    return this.values.label ?? this.values.name;
  }

  getDescription(): string | null {
    return this.values.description ?? null;
  }

  getCardinality(): number {
    return this.values.cardinality ?? 1;
  }

  isMultiple(): boolean {
    const cardinality = this.getCardinality();
    return cardinality > 1 || cardinality === CARDINALITY_UNLIMITED;
  }

  getPropertyDefinitions(): Record<string, DataDefinitionInterface> {
    if (this.propertyDefinitionsCache === null) {
      this.propertyDefinitionsCache = this.values.itemClass.propertyDefinitions(this);
    }
    return this.propertyDefinitionsCache;
  }

  getPropertyDefinition(name: string): DataDefinitionInterface | null {
    return this.getPropertyDefinitions()[name] ?? null;
  }

  getPropertyNames(): string[] {
    return Object.keys(this.getPropertyDefinitions());
  }

  getMainPropertyName(): string | null {
    return this.values.itemClass.mainPropertyName();
  }

  getTargetEntityTypeId(): string {
    return this.values.entityTypeId;
  }

  getSchema(): FieldSchema | Record<string, never> {
    return this.values.itemClass.schema(this);
  }

  getColumns(): Record<string, SchemaColumn> {
    const schema = this.getSchema() as FieldSchema;
    return schema.columns ?? {};
  }

  getProvider(): string | null {
    return this.values.provider ?? null;
  }

  hasCustomStorage(): boolean {
    return Boolean(this.values.customStorage);
  }

  isBaseField(): boolean {
    return this.values.baseField ?? true;
  }

  getUniqueStorageIdentifier(): string {
    return `${this.getTargetEntityTypeId()}-${this.getName()}`;
  }

  isDeleted(): boolean {
    return Boolean(this.values.deleted);
  }

  /**
   * Builds the typed-data list definition describing this field's value list.
   * Used by the field item list to know its item definition.
   */
  toListDefinition(): ListDataDefinition {
    return ListDataDefinition.create(`field_item:${this.getType()}`);
  }
}
