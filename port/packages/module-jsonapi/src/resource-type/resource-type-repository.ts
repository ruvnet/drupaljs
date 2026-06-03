/**
 * Port of `Drupal\jsonapi\ResourceType\ResourceTypeRepositoryInterface` and a
 * minimal, in-memory implementation.
 *
 * In Drupal the repository discovers resource types by inspecting every entity
 * type + bundle and dispatching a build event. That discovery requires the full
 * entity/field API which is not yet ported, so this implementation is seeded
 * with a fixed set of {@link ResourceType}s (e.g. by tests or a future
 * bootstrap). Lookups (`all`, `get`, `getByTypeName`) match the PHP contract.
 *
 * TODO(@drupaljs/entity): wire automatic discovery once the entity-type and
 * field-definition APIs land.
 */

import { ResourceType } from './resource-type.js';

/** The repository contract: lists and looks up resource types. */
export interface ResourceTypeRepositoryInterface {
  /** Every resource type known to the repository. */
  all(): ResourceType[];
  /** Look up by entity type + bundle, or null. */
  get(entityTypeId: string, bundle: string): ResourceType | null;
  /** Look up by JSON:API type name (e.g. `node--article`), or null. */
  getByTypeName(typeName: string): ResourceType | null;
}

export class ResourceTypeRepository implements ResourceTypeRepositoryInterface {
  private readonly resourceTypes: ResourceType[];
  private readonly byTypeName: Map<string, ResourceType>;

  constructor(resourceTypes: ResourceType[] = []) {
    this.resourceTypes = [...resourceTypes];
    this.byTypeName = new Map(
      this.resourceTypes.map((rt) => [rt.getTypeName(), rt]),
    );
  }

  all(): ResourceType[] {
    return [...this.resourceTypes];
  }

  get(entityTypeId: string, bundle: string): ResourceType | null {
    return (
      this.resourceTypes.find(
        (rt) => rt.getEntityTypeId() === entityTypeId && rt.getBundle() === bundle,
      ) ?? null
    );
  }

  getByTypeName(typeName: string): ResourceType | null {
    return this.byTypeName.get(typeName) ?? null;
  }
}
