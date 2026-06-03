import type {
  ConstraintDefinitions,
  ConstraintViolation,
  DataDefinitionInterface,
  TraversableTypedDataInterface,
  TypedDataInterface,
} from './contracts.js';
import type { TypedDataManager } from './manager.js';

/**
 * The abstract base class for typed data.
 *
 * Ported from Drupal\Core\TypedData\TypedData. Subclasses store their value
 * (or override getValue/setValue). The typed data manager is injected after
 * construction (mirroring setTypedDataManager()).
 */
export abstract class TypedData implements TypedDataInterface {
  protected definition: DataDefinitionInterface;
  protected name: string | number | null;
  protected parent: TraversableTypedDataInterface | null;
  protected typedDataManager?: TypedDataManager;
  protected value: unknown = null;

  constructor(
    definition: DataDefinitionInterface,
    name: string | number | null = null,
    parent: TraversableTypedDataInterface | null = null,
  ) {
    this.definition = definition;
    this.name = name;
    this.parent = parent;
  }

  /**
   * Factory used by the manager. Subclasses inherit this and are instantiated
   * via `new this(...)` thanks to the late-bound constructor.
   */
  static createInstance(
    this: new (
      definition: DataDefinitionInterface,
      name?: string | number | null,
      parent?: TraversableTypedDataInterface | null,
    ) => TypedData,
    definition: DataDefinitionInterface,
    name: string | number | null = null,
    parent: TraversableTypedDataInterface | null = null,
  ): TypedData {
    return new this(definition, name, parent);
  }

  setTypedDataManager(manager: TypedDataManager): this {
    this.typedDataManager = manager;
    return this;
  }

  protected getTypedDataManager(): TypedDataManager {
    if (!this.typedDataManager) {
      throw new Error('The typed data manager has not been set on this object.');
    }
    return this.typedDataManager;
  }

  getDataDefinition(): DataDefinitionInterface {
    return this.definition;
  }

  getValue(): unknown {
    return this.value;
  }

  setValue(value: unknown, notify = true): void {
    this.value = value;
    if (notify && this.parent) {
      this.parent.onChange(this.name as string | number);
    }
  }

  getString(): string {
    const value = this.getValue();
    return value === null || value === undefined ? '' : String(value);
  }

  getConstraints(): ConstraintDefinitions {
    return this.definition.getConstraints();
  }

  /**
   * Validates the current value against the definition's constraints.
   *
   * This is a minimal hook point. It only enforces the NotNull constraint
   * implied by isRequired(); a full Symfony-style recursive validator is out of
   * scope for this package.
   *
   * TODO: Delegate to @drupaljs/validation's RecursiveValidator once available,
   * and resolve constraint plugins through a real constraint manager.
   */
  validate(): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const value = this.getValue();
    if (this.definition.isRequired() && (value === null || value === undefined)) {
      violations.push({
        message: 'This value should not be null.',
        propertyPath: this.getPropertyPath(),
        invalidValue: value,
        constraint: 'NotNull',
      });
    }
    return violations;
  }

  applyDefaultValue(notify = true): this {
    this.setValue(null, notify);
    return this;
  }

  setContext(
    name: string | number | null = null,
    parent: TraversableTypedDataInterface | null = null,
  ): void {
    this.name = name;
    this.parent = parent;
  }

  getName(): string | number | null {
    return this.name;
  }

  getParent(): TraversableTypedDataInterface | null {
    return this.parent;
  }

  getRoot(): TypedDataInterface {
    if (this.parent) {
      return this.parent.getRoot();
    }
    return this;
  }

  getPropertyPath(): string {
    if (this.parent) {
      const prefix = this.parent.getPropertyPath();
      return prefix !== '' ? `${prefix}.${this.name}` : String(this.name);
    }
    if (this.name !== null && this.name !== undefined) {
      return String(this.name);
    }
    return '';
  }
}
