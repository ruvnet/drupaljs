/**
 * Port of `Drupal\jsonapi\ResourceType\ResourceTypeField` and its two concrete
 * subclasses (`ResourceTypeAttribute`, `ResourceTypeRelationship`).
 *
 * A value object holding the metadata for a single JSON:API field: its internal
 * (entity) name, its public (API) name, whether it is enabled, and whether it is
 * single- or multi-valued. All mutators return new instances (the PHP original
 * is likewise immutable, returning `new static(...)`).
 */

/**
 * Abstract base for a JSON:API resource field. Subclasses must implement
 * {@link clone} so the immutable `with*` helpers can preserve the concrete type.
 */
export abstract class ResourceTypeField {
  protected readonly internalName: string;
  protected readonly publicName: string;
  protected readonly enabledFlag: boolean;
  protected readonly hasOneFlag: boolean;

  constructor(
    internalName: string,
    publicName?: string,
    enabled = true,
    hasOne = true,
  ) {
    this.internalName = internalName;
    this.publicName = publicName || internalName;
    this.enabledFlag = enabled;
    this.hasOneFlag = hasOne;
  }

  /**
   * Returns a new instance of the concrete subclass with the given core state.
   * Ports the `new static(...)` pattern from PHP.
   */
  protected abstract clone(
    internalName: string,
    publicName: string,
    enabled: boolean,
    hasOne: boolean,
  ): this;

  getInternalName(): string {
    return this.internalName;
  }

  getPublicName(): string {
    return this.publicName;
  }

  /** A new instance with a different public name. */
  withPublicName(publicName: string): this {
    return this.clone(this.internalName, publicName, this.enabledFlag, this.hasOneFlag);
  }

  /** A new, disabled instance. */
  disabled(): this {
    return this.clone(this.internalName, this.publicName, false, this.hasOneFlag);
  }

  /** A new, enabled instance. */
  enabled(): this {
    return this.clone(this.internalName, this.publicName, true, this.hasOneFlag);
  }

  isFieldEnabled(): boolean {
    return this.enabledFlag;
  }

  hasOne(): boolean {
    return this.hasOneFlag;
  }

  hasMany(): boolean {
    return !this.hasOneFlag;
  }
}

/**
 * A non-relationship field (becomes a JSON:API `attribute`).
 * Ports `Drupal\jsonapi\ResourceType\ResourceTypeAttribute`.
 */
export class ResourceTypeAttribute extends ResourceTypeField {
  protected clone(
    internalName: string,
    publicName: string,
    enabled: boolean,
    hasOne: boolean,
  ): this {
    return new ResourceTypeAttribute(internalName, publicName, enabled, hasOne) as this;
  }
}

/**
 * An entity-reference field (becomes a JSON:API `relationship`). Ports
 * `Drupal\jsonapi\ResourceType\ResourceTypeRelationship`, modelling relatable
 * resource types as their type-name strings (the full ResourceType graph is
 * resolved lazily by the repository in Drupal).
 */
export class ResourceTypeRelationship extends ResourceTypeField {
  private readonly relatableResourceTypeNames: readonly string[];

  constructor(
    internalName: string,
    publicName?: string,
    enabled = true,
    hasOne = true,
    relatableResourceTypeNames: readonly string[] = [],
  ) {
    super(internalName, publicName, enabled, hasOne);
    this.relatableResourceTypeNames = relatableResourceTypeNames;
  }

  protected clone(
    internalName: string,
    publicName: string,
    enabled: boolean,
    hasOne: boolean,
  ): this {
    return new ResourceTypeRelationship(
      internalName,
      publicName,
      enabled,
      hasOne,
      this.relatableResourceTypeNames,
    ) as this;
  }

  /** The resource-type names this relationship may target. */
  getRelatableResourceTypeNames(): string[] {
    return [...this.relatableResourceTypeNames];
  }

  /** A new instance carrying the given relatable resource type names. */
  withRelatableResourceTypeNames(names: readonly string[]): this {
    return new ResourceTypeRelationship(
      this.internalName,
      this.publicName,
      this.enabledFlag,
      this.hasOneFlag,
      names,
    ) as this;
  }
}
