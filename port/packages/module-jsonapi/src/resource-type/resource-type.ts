/**
 * Port of `Drupal\jsonapi\ResourceType\ResourceType`.
 *
 * A value object holding all metadata for a JSON:API resource type (an entity
 * type + bundle pair): its name, path, the internal<->public field-name
 * mapping, the enabled fields, and the locatable/mutable/internal/versionable
 * flags used to drive route generation.
 */

import {
  ResourceTypeField,
  ResourceTypeRelationship,
} from './resource-type-field.js';

/** The path separator embedded in a resource type name. `node--article`. */
export const TYPE_NAME_URI_PATH_SEPARATOR = '--';

/**
 * Construction options for a {@link ResourceType}. Mirrors the positional
 * constructor of the PHP class but as a named-options object for clarity.
 */
export interface ResourceTypeOptions {
  entityTypeId: string;
  bundle: string;
  /** Whether the type is internal (no HTTP routes). Defaults to false. */
  internal?: boolean;
  /** Whether resources are locatable (stored). Defaults to true. */
  locatable?: boolean;
  /** Whether resources are mutable (POST/PATCH/DELETE). Defaults to true. */
  mutable?: boolean;
  /** Whether resources are versionable. Defaults to false. */
  versionable?: boolean;
  /** The resource type fields. Defaults to none. */
  fields?: ResourceTypeField[];
  /** Explicit type name; defaults to `entityTypeId--bundle`. */
  typeName?: string;
}

export class ResourceType {
  private readonly entityTypeId: string;
  private readonly bundle: string;
  private readonly internal: boolean;
  private readonly locatable: boolean;
  private readonly mutable: boolean;
  private readonly versionable: boolean;
  private readonly typeName: string;

  /** Fields keyed by internal field name. */
  private readonly fields: Map<string, ResourceTypeField>;
  /** public field name -> internal field name. */
  private readonly fieldMapping: Map<string, string>;

  constructor(options: ResourceTypeOptions) {
    this.entityTypeId = options.entityTypeId;
    this.bundle = options.bundle;
    this.internal = options.internal ?? false;
    this.locatable = options.locatable ?? true;
    this.mutable = options.mutable ?? true;
    this.versionable = options.versionable ?? false;

    this.typeName =
      options.typeName ??
      (this.bundle === '?'
        ? 'unknown'
        : `${this.entityTypeId}${TYPE_NAME_URI_PATH_SEPARATOR}${this.bundle}`);

    this.fields = new Map();
    this.fieldMapping = new Map();
    for (const field of options.fields ?? []) {
      this.fields.set(field.getInternalName(), field);
      this.fieldMapping.set(field.getPublicName(), field.getInternalName());
    }
  }

  getEntityTypeId(): string {
    return this.entityTypeId;
  }

  getBundle(): string {
    return this.bundle;
  }

  getTypeName(): string {
    return this.typeName;
  }

  /** Path for this resource type: `/node/article` for `node--article`. */
  getPath(): string {
    return '/' + this.typeName.split(TYPE_NAME_URI_PATH_SEPARATOR).join('/');
  }

  isInternal(): boolean {
    return this.internal;
  }

  isLocatable(): boolean {
    return this.locatable;
  }

  isMutable(): boolean {
    return this.mutable;
  }

  isVersionable(): boolean {
    return this.versionable;
  }

  /** Whether collection queries include a count. Always false by default. */
  includeCount(): boolean {
    return false;
  }

  /** Translates an internal field name to its public name. */
  getPublicName(fieldName: string): string {
    const field = this.fields.get(fieldName);
    return field ? field.getPublicName() : fieldName;
  }

  /** Translates a public field name to its internal name. */
  getInternalName(fieldName: string): string {
    return this.fieldMapping.get(fieldName) ?? fieldName;
  }

  /** All fields keyed by internal name. */
  getFields(): ResourceTypeField[] {
    return [...this.fields.values()];
  }

  hasField(fieldName: string): boolean {
    return this.fields.has(fieldName);
  }

  isFieldEnabled(fieldName: string): boolean {
    const field = this.fields.get(fieldName);
    return field !== undefined && field.isFieldEnabled();
  }

  getFieldByInternalName(internalName: string): ResourceTypeField | null {
    return this.fields.get(internalName) ?? null;
  }

  getFieldByPublicName(publicName: string): ResourceTypeField | null {
    const internal = this.fieldMapping.get(publicName);
    return internal === undefined ? null : (this.fields.get(internal) ?? null);
  }

  /**
   * All relatable resource type names keyed by public relationship field name.
   * Considers only enabled relationship fields. Ports
   * ResourceType::getRelatableResourceTypes().
   */
  getRelatableResourceTypes(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const field of this.fields.values()) {
      if (field instanceof ResourceTypeRelationship && field.isFieldEnabled()) {
        result[field.getPublicName()] = field.getRelatableResourceTypeNames();
      }
    }
    return result;
  }

  /** Relatable resource type names for one public field name (empty if none). */
  getRelatableResourceTypesByField(fieldName: string): string[] {
    const field = this.getFieldByPublicName(fieldName);
    return field instanceof ResourceTypeRelationship && field.isFieldEnabled()
      ? field.getRelatableResourceTypeNames()
      : [];
  }
}
