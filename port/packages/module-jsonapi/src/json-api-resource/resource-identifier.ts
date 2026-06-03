/**
 * Port of `Drupal\jsonapi\JsonApiResource\ResourceIdentifier`.
 *
 * A JSON:API resource identifier object: a `{ type, id }` pair plus optional
 * `meta`, where `meta.arity` distinguishes otherwise-duplicate "parallel"
 * relationships (Drupal allows multiple references to the same entity, which the
 * spec forbids without disambiguation).
 *
 * The entity-reference factories (`toResourceIdentifier(s)`, `fromEntity`) from
 * the PHP class are intentionally omitted: they require the field/entity API
 * (not yet ported). The comparison / arity / deduplication algorithms — the
 * reusable core — are ported faithfully.
 *
 * TODO(@drupaljs/field): add the EntityReferenceItem -> ResourceIdentifier
 * factories once the field API lands.
 */

import { ResourceType } from '../resource-type/resource-type.js';

const ARITY_KEY = 'arity';

/** Resource identifier metadata. May carry an `arity` (non-negative int). */
export type ResourceIdentifierMeta = Record<string, unknown> & {
  [ARITY_KEY]?: number;
};

export class ResourceIdentifier {
  private readonly resourceTypeName: string;
  private readonly id: string;
  private readonly meta: ResourceIdentifierMeta;

  constructor(
    resourceType: ResourceType | string,
    id: string,
    meta: ResourceIdentifierMeta = {},
  ) {
    const arity = meta[ARITY_KEY];
    if (arity !== undefined && (!Number.isInteger(arity) || arity < 0)) {
      throw new Error('arity must be a non-negative integer');
    }
    this.resourceTypeName =
      typeof resourceType === 'string'
        ? resourceType
        : resourceType.getTypeName();
    this.id = id;
    this.meta = { ...meta };
  }

  getTypeName(): string {
    return this.resourceTypeName;
  }

  getId(): string {
    return this.id;
  }

  getMeta(): ResourceIdentifierMeta {
    return { ...this.meta };
  }

  hasArity(): boolean {
    return this.meta[ARITY_KEY] !== undefined;
  }

  getArity(): number {
    const arity = this.meta[ARITY_KEY];
    if (arity === undefined) {
      throw new Error('ResourceIdentifier has no arity; check hasArity() first');
    }
    return arity;
  }

  /** A copy with the given arity (non-negative). */
  withArity(arity: number): ResourceIdentifier {
    return new ResourceIdentifier(this.resourceTypeName, this.id, {
      ...this.meta,
      [ARITY_KEY]: arity,
    });
  }

  /**
   * Compares two identifiers. Orders by `type:id`; when those are equal and both
   * carry an arity, orders by `arity(a) - arity(b)`; otherwise 0 (equal).
   * Ports ResourceIdentifier::compare().
   */
  static compare(a: ResourceIdentifier, b: ResourceIdentifier): number {
    const keyA = `${a.getTypeName()}:${a.getId()}`;
    const keyB = `${b.getTypeName()}:${b.getId()}`;
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return a.hasArity() && b.hasArity() ? a.getArity() - b.getArity() : 0;
  }

  /** True when the two identify the same resource without a distinct arity. */
  static isDuplicate(a: ResourceIdentifier, b: ResourceIdentifier): boolean {
    return ResourceIdentifier.compare(a, b) === 0;
  }

  /** True when both identify the same resource, ignoring arity. */
  static isParallel(a: ResourceIdentifier, b: ResourceIdentifier): boolean {
    return ResourceIdentifier.compare(a.withArity(0), b.withArity(0)) === 0;
  }

  /** Removes duplicate identifiers (by {@link isDuplicate}), preserving order. */
  static deduplicate(
    resourceIdentifiers: ResourceIdentifier[],
  ): ResourceIdentifier[] {
    const result: ResourceIdentifier[] = [];
    for (const current of resourceIdentifiers) {
      const isDup = result.some((previous) =>
        ResourceIdentifier.isDuplicate(previous, current),
      );
      if (!isDup) {
        result.push(current);
      }
    }
    return result;
  }

  /** Whether the given identifiers are all unique. */
  static areResourceIdentifiersUnique(
    resourceIdentifiers: ResourceIdentifier[],
  ): boolean {
    return (
      resourceIdentifiers.length ===
      ResourceIdentifier.deduplicate(resourceIdentifiers).length
    );
  }
}
