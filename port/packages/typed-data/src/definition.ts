import type {
  ConstraintDefinitions,
  DataDefinitionInterface,
} from './contracts.js';

/**
 * A typed data definition class for defining data based on defined data types.
 *
 * Ported from Drupal\Core\TypedData\DataDefinition. The PHP class also
 * implements \ArrayAccess for BC; that is intentionally omitted (toArray()
 * covers the structural access need without the legacy surface).
 */
export class DataDefinition implements DataDefinitionInterface {
  /** The object holding values for all definition keys. */
  protected definition: Record<string, unknown>;

  constructor(values: Record<string, unknown> = {}) {
    this.definition = { ...values };
  }

  /** Creates a new data definition of the given type. */
  static create(type: string): DataDefinition {
    return new this({ type });
  }

  /** {@inheritdoc} */
  static createFromDataType(type: string): DataDefinition {
    return this.create(type);
  }

  getDataType(): string {
    const type = this.definition['type'];
    return typeof type === 'string' && type !== '' ? type : 'any';
  }

  setDataType(type: string): this {
    this.definition['type'] = type;
    return this;
  }

  getLabel(): string | null {
    return (this.definition['label'] as string | undefined) ?? null;
  }

  setLabel(label: string): this {
    this.definition['label'] = label;
    return this;
  }

  getDescription(): string | null {
    return (this.definition['description'] as string | undefined) ?? null;
  }

  setDescription(description: string): this {
    this.definition['description'] = description;
    return this;
  }

  /**
   * Whether the data is a list. Overridden by list definitions; the base
   * definition is never a list.
   */
  isList(): boolean {
    return false;
  }

  isReadOnly(): boolean {
    if (this.definition['read-only'] === undefined) {
      // Default to read-only if the value is computed.
      return this.isComputed();
    }
    return Boolean(this.definition['read-only']);
  }

  setReadOnly(readOnly: boolean): this {
    this.definition['read-only'] = readOnly;
    return this;
  }

  isComputed(): boolean {
    return Boolean(this.definition['computed']);
  }

  setComputed(computed: boolean): this {
    this.definition['computed'] = computed;
    return this;
  }

  isRequired(): boolean {
    return Boolean(this.definition['required']);
  }

  setRequired(required: boolean): this {
    this.definition['required'] = required;
    return this;
  }

  getClass(): string | null {
    return (this.definition['class'] as string | undefined) ?? null;
  }

  setClass(cls: string | null): this {
    this.definition['class'] = cls;
    return this;
  }

  getSettings(): Record<string, unknown> {
    return (this.definition['settings'] as Record<string, unknown> | undefined) ?? {};
  }

  setSettings(settings: Record<string, unknown>): this {
    this.definition['settings'] = settings;
    return this;
  }

  getSetting(settingName: string): unknown {
    const settings = this.definition['settings'] as Record<string, unknown> | undefined;
    return settings?.[settingName] ?? null;
  }

  setSetting(settingName: string, value: unknown): this {
    const settings = (this.definition['settings'] as Record<string, unknown> | undefined) ?? {};
    settings[settingName] = value;
    this.definition['settings'] = settings;
    return this;
  }

  getConstraints(): ConstraintDefinitions {
    return (this.definition['constraints'] as ConstraintDefinitions | undefined) ?? {};
  }

  getConstraint(constraintName: string): unknown {
    return this.getConstraints()[constraintName] ?? null;
  }

  setConstraints(constraints: ConstraintDefinitions): this {
    this.definition['constraints'] = constraints;
    return this;
  }

  addConstraint(constraintName: string, options: unknown = null): this {
    const constraints = (this.definition['constraints'] as ConstraintDefinitions | undefined) ?? {};
    constraints[constraintName] = options;
    this.definition['constraints'] = constraints;
    return this;
  }

  isInternal(): boolean {
    if (this.definition['internal'] !== undefined) {
      return Boolean(this.definition['internal']);
    }
    // Default to internal for computed fields.
    return this.isComputed();
  }

  setInternal(internal: boolean): this {
    this.definition['internal'] = internal;
    return this;
  }

  /** Returns all definition values as a plain object. */
  toArray(): Record<string, unknown> {
    return { ...this.definition };
  }
}
