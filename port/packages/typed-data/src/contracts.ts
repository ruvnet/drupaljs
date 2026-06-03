/**
 * Public contracts for the Typed Data API.
 *
 * Ported from Drupal\Core\TypedData (Drupal 11 core). The PHP interfaces use
 * loose typing; here we encode them with TypeScript interfaces. Constraint
 * integration is reduced to a thin hook point — full Symfony validator
 * semantics are out of scope for this package (see TODO in validation hook).
 */

/**
 * A constraint definition keyed by constraint plugin id with arbitrary options.
 *
 * TODO: When @drupaljs/validation lands, replace `unknown` options with the
 * real Symfony-style constraint option contracts.
 */
export type ConstraintDefinitions = Record<string, unknown>;

/**
 * Interface for data definitions.
 *
 * @see Drupal\Core\TypedData\DataDefinitionInterface
 */
export interface DataDefinitionInterface {
  getDataType(): string;
  getLabel(): string | null;
  getDescription(): string | null;
  isList(): boolean;
  isReadOnly(): boolean;
  isComputed(): boolean;
  isRequired(): boolean;
  /** The class id used for creating the typed data object, or null for the type default. */
  getClass(): string | null;
  getSettings(): Record<string, unknown>;
  getSetting(settingName: string): unknown;
  getConstraints(): ConstraintDefinitions;
  getConstraint(constraintName: string): unknown;
  addConstraint(constraintName: string, options?: unknown): this;
  isInternal(): boolean;
}

/**
 * Interface for complex data definitions (named properties).
 *
 * @see Drupal\Core\TypedData\ComplexDataDefinitionInterface
 */
export interface ComplexDataDefinitionInterface extends DataDefinitionInterface {
  getPropertyDefinition(name: string): DataDefinitionInterface | null;
  getPropertyDefinitions(): Record<string, DataDefinitionInterface>;
  getMainPropertyName(): string | null;
}

/**
 * Interface for data definitions of lists.
 *
 * @see Drupal\Core\TypedData\ListDataDefinitionInterface
 */
export interface ListDataDefinitionInterface extends DataDefinitionInterface {
  getItemDefinition(): DataDefinitionInterface;
}

/**
 * Interface for typed data objects.
 *
 * @see Drupal\Core\TypedData\TypedDataInterface
 */
export interface TypedDataInterface {
  getDataDefinition(): DataDefinitionInterface;
  getValue(): unknown;
  setValue(value: unknown, notify?: boolean): void;
  getString(): string;
  getConstraints(): ConstraintDefinitions;
  /** Returns a list of validation violations (empty when valid). */
  validate(): ConstraintViolation[];
  applyDefaultValue(notify?: boolean): this;
  getName(): string | number | null;
  getParent(): TraversableTypedDataInterface | null;
  getRoot(): TypedDataInterface;
  getPropertyPath(): string;
  setContext(name?: string | number | null, parent?: TraversableTypedDataInterface | null): void;
}

/**
 * A typed data object that contains children and reacts to their changes.
 *
 * @see Drupal\Core\TypedData\TraversableTypedDataInterface
 */
export interface TraversableTypedDataInterface extends TypedDataInterface {
  onChange(name: string | number): void;
  [Symbol.iterator](): Iterator<TypedDataInterface>;
}

/**
 * Interface for primitive data types.
 *
 * @see Drupal\Core\TypedData\PrimitiveInterface
 */
export interface PrimitiveInterface extends TypedDataInterface {
  /** Returns the casted plain value (e.g. number, boolean, string). */
  getCastedValue(): unknown;
}

/**
 * Interface for complex data; data containing named and typed properties.
 *
 * @see Drupal\Core\TypedData\ComplexDataInterface
 */
export interface ComplexDataInterface extends TraversableTypedDataInterface {
  getDataDefinition(): ComplexDataDefinitionInterface;
  get(propertyName: string): TypedDataInterface;
  set(propertyName: string, value: unknown, notify?: boolean): this;
  getProperties(includeComputed?: boolean): Record<string, TypedDataInterface>;
  toArray(): Record<string, unknown>;
  isEmpty(): boolean;
}

/**
 * Interface for an ordered list of typed data items of the same type.
 *
 * @see Drupal\Core\TypedData\ListInterface
 */
export interface ListInterface extends TraversableTypedDataInterface {
  getDataDefinition(): ListDataDefinitionInterface;
  isEmpty(): boolean;
  getItemDefinition(): DataDefinitionInterface;
  get(index: number): TypedDataInterface | null;
  set(index: number, value: unknown): this;
  first(): TypedDataInterface | null;
  last(): TypedDataInterface | null;
  appendItem(value?: unknown): TypedDataInterface;
  removeItem(index: number): this;
  filter(callback: (item: TypedDataInterface) => boolean): this;
  count(): number;
}

/**
 * A single validation violation.
 *
 * TODO: Replace with the full ConstraintViolationListInterface contract once
 * @drupaljs/validation exists. For now this captures the essentials.
 */
export interface ConstraintViolation {
  message: string;
  propertyPath: string;
  invalidValue: unknown;
  constraint: string;
}

/**
 * A plugin definition describing a data type, derived from the PHP DataType
 * attribute.
 *
 * @see Drupal\Core\TypedData\Attribute\DataType
 */
export interface DataTypeDefinition {
  id: string;
  label: string;
  description?: string;
  /** Factory creating the typed-data instance class for this type. */
  class: TypedDataConstructor;
  /** Factory creating the definition class for this type. */
  definitionClass: DataDefinitionConstructor;
  /** Factory creating the list class wrapping multiple items of this type. */
  listClass: TypedDataConstructor;
  /** Definition class used when defining a list of this type. */
  listDefinitionClass: ListDataDefinitionConstructor;
  constraints?: ConstraintDefinitions;
}

/**
 * Constructor shape for typed-data instance classes. They are instantiated via
 * the static createInstance() factory rather than `new`, mirroring Drupal.
 */
export interface TypedDataConstructor {
  createInstance(
    definition: DataDefinitionInterface,
    name?: string | number | null,
    parent?: TraversableTypedDataInterface | null,
  ): TypedDataInterface;
}

/** Constructor shape for data definition classes. */
export interface DataDefinitionConstructor {
  createFromDataType(dataType: string): DataDefinitionInterface;
}

/** Constructor shape for list data definition classes. */
export interface ListDataDefinitionConstructor {
  createFromItemType(itemType: string): ListDataDefinitionInterface;
}
