/**
 * A class representing a view result row.
 *
 * Ports `Drupal\views\ResultRow`. The PHP class uses `#[AllowDynamicProperties]`
 * to let field aliases be set as arbitrary public properties; in TypeScript we
 * keep those aliased values in an explicit {@link ResultRow.values} bag (with
 * {@link ResultRow.get}/{@link ResultRow.set} sugar) and model the reserved
 * `_entity` / `_relationship_entities` / `index` members as typed fields.
 */
export class ResultRow {
  /**
   * The loaded entity for this result, if any (Drupal's `$_entity`).
   * `null` until the query plugin's `loadEntities()` populates it.
   */
  entity: unknown = null;

  /**
   * Relationship entities keyed by relationship id (Drupal's
   * `$_relationship_entities`).
   */
  relationshipEntities: Record<string, unknown> = {};

  /**
   * An incremental number representing the row's position in the entire result
   * set (Drupal's `$index`). Set by the query plugin during `execute()`.
   */
  index?: number;

  /**
   * Field-aliased values for the row (the dynamic public properties in the PHP
   * original). Keyed by field alias.
   */
  readonly values: Record<string, unknown> = {};

  /**
   * @param values Initial aliased values to add to the row.
   */
  constructor(values: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(values)) {
      this.values[key] = value;
    }
  }

  /** Returns an aliased value. */
  get(key: string): unknown {
    return this.values[key];
  }

  /** Sets an aliased value; returns `this` for chaining. */
  set(key: string, value: unknown): this {
    this.values[key] = value;
    return this;
  }

  /** Resets the entity and relationship-entity properties (ports resetEntityData()). */
  resetEntityData(): void {
    this.entity = null;
    this.relationshipEntities = {};
  }
}
