import { ListDataDefinition } from '@drupaljs/typed-data';
import type { DataDefinitionInterface } from '@drupaljs/typed-data';
import { FieldException } from './exception.js';
import type {
  DisplayContext,
  DisplayOptions,
  FieldableEntityInterface,
  FieldDefinitionInterface,
  FieldStorageDefinitionInterface,
} from './contracts.js';

/** Mutable backing values for a {@link FieldDefinition}. */
export interface FieldDefinitionValues {
  storageDefinition: FieldStorageDefinitionInterface;
  bundle?: string | null;
  label?: string;
  description?: string | null;
  required?: boolean;
  translatable?: boolean;
  /** Field-level settings, merged over storage settings. */
  settings?: Record<string, unknown>;
  defaultValue?: Array<Record<string, unknown>>;
  defaultValueCallback?: string | null;
  displayOptions?: Partial<Record<DisplayContext, DisplayOptions>>;
  displayConfigurable?: Partial<Record<DisplayContext, boolean>>;
}

/**
 * A field definition attached to a specific entity type + bundle.
 *
 * Port of the bundle-level concerns of `Drupal\Core\Field\FieldDefinition`. It
 * delegates storage concerns to its {@link FieldStorageDefinitionInterface} and
 * extends the typed-data list definition contract (a field is a list of items).
 *
 * @see \Drupal\Core\Field\FieldDefinitionInterface
 */
export class FieldDefinition extends ListDataDefinition implements FieldDefinitionInterface {
  protected fieldValues: FieldDefinitionValues;

  constructor(values: FieldDefinitionValues) {
    if (!values.storageDefinition) {
      throw new FieldException('A field definition requires a storage definition.');
    }
    super(
      { label: values.label, required: values.required },
      ListDataDefinition.create(`field_item:${values.storageDefinition.getType()}`).getItemDefinition(),
    );
    this.fieldValues = { ...values };
  }

  /** Factory creating a field definition from an existing storage definition. */
  static createFromStorageDefinition(
    storageDefinition: FieldStorageDefinitionInterface,
    overrides: Omit<FieldDefinitionValues, 'storageDefinition'> = {},
  ): FieldDefinition {
    return new this({ storageDefinition, ...overrides });
  }

  getName(): string {
    return this.fieldValues.storageDefinition.getName();
  }

  getType(): string {
    return this.fieldValues.storageDefinition.getType();
  }

  getTargetEntityTypeId(): string | null {
    return this.fieldValues.storageDefinition.getTargetEntityTypeId();
  }

  getTargetBundle(): string | null {
    return this.fieldValues.bundle ?? null;
  }

  override getLabel(): string {
    return this.fieldValues.label ?? this.fieldValues.storageDefinition.getLabel();
  }

  override getDescription(): string | null {
    return this.fieldValues.description ?? this.fieldValues.storageDefinition.getDescription();
  }

  override isRequired(): boolean {
    return Boolean(this.fieldValues.required);
  }

  isTranslatable(): boolean {
    if (this.fieldValues.translatable !== undefined) {
      return this.fieldValues.translatable;
    }
    return this.fieldValues.storageDefinition.isTranslatable();
  }

  isDisplayConfigurable(displayContext: DisplayContext): boolean {
    return this.fieldValues.displayConfigurable?.[displayContext] ?? false;
  }

  getDisplayOptions(displayContext: DisplayContext): DisplayOptions | null {
    return this.fieldValues.displayOptions?.[displayContext] ?? null;
  }

  override getSettings(): Record<string, unknown> {
    return {
      ...this.fieldValues.storageDefinition.getSettings(),
      ...(this.fieldValues.settings ?? {}),
    };
  }

  override getSetting(settingName: string): unknown {
    return this.getSettings()[settingName] ?? null;
  }

  getDefaultValueLiteral(): Array<Record<string, unknown>> {
    return this.fieldValues.defaultValue ?? [];
  }

  getDefaultValueCallback(): string | null {
    return this.fieldValues.defaultValueCallback ?? null;
  }

  getDefaultValue(_entity: FieldableEntityInterface): Array<Record<string, unknown>> {
    // Runtime callbacks are not yet wired; return the literal default.
    // TODO(@drupaljs/entity): invoke defaultValueCallback against the entity.
    return this.getDefaultValueLiteral();
  }

  getFieldStorageDefinition(): FieldStorageDefinitionInterface {
    return this.fieldValues.storageDefinition;
  }

  getUniqueIdentifier(): string {
    const bundle = this.getTargetBundle() ?? '';
    return `${this.fieldValues.storageDefinition.getUniqueStorageIdentifier()}-${bundle}`;
  }

  override getItemDefinition(): DataDefinitionInterface {
    return super.getItemDefinition();
  }
}
