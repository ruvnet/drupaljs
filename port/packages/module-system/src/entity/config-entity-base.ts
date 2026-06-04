/**
 * Minimal config-entity base.
 *
 * TODO(@drupaljs/entity): the `entity` package is not yet populated. This is a
 * LOCAL minimal stand-in for `Drupal\Core\Config\Entity\ConfigEntityBase`,
 * covering only the surface the system module's config entities need: an id /
 * label, a `config_export`-driven `toArray()`, and `getEntityTypeId()`. Replace
 * with the shared ConfigEntityBase once it lands.
 */

/**
 * The faithful subset of `#[ConfigEntityType(...)]` metadata we carry per
 * entity. Field names mirror the PHP attribute keys.
 */
export interface ConfigEntityTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly entity_keys: Record<string, string>;
  readonly admin_permission?: string;
  /** Ordered list of properties persisted to config (drives toArray()). */
  readonly config_export: readonly string[];
}

/** Common values every config entity accepts. */
export interface ConfigEntityValues {
  id?: string;
  label?: string;
  [key: string]: unknown;
}

export abstract class ConfigEntityBase {
  protected readonly values: ConfigEntityValues;

  protected constructor(values: ConfigEntityValues) {
    this.values = { ...values };
  }

  /** The entity-type definition. Subclasses bind their own. */
  protected abstract entityType(): ConfigEntityTypeDefinition;

  id(): string | undefined {
    return this.values.id;
  }

  label(): string | undefined {
    return this.values.label;
  }

  getEntityTypeId(): string {
    return this.entityType().id;
  }

  /**
   * Serializes the entity to its config representation — only the keys listed
   * in `config_export`, in declaration order (faithful to
   * ConfigEntityBase::toArray()).
   */
  toArray(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of this.entityType().config_export) {
      out[key] = this.exportValue(key);
    }
    return out;
  }

  /**
   * Resolves the exported value for a config_export key. Subclasses override to
   * supply defaults (e.g. Action's empty `configuration`).
   */
  protected exportValue(key: string): unknown {
    return this.values[key];
  }
}
