/**
 * Port of Drupal\field_ui\FieldUI.
 *
 * Framework-agnostic route/redirect helpers for Field UI. The PHP original
 * pulls the EntityTypeManager off the static \Drupal container; here the entity
 * type definition is passed in explicitly, keeping the helpers pure and
 * testable.
 *
 * @see drupal-core/core/modules/field_ui/src/FieldUI.php
 */

import type {
  Destination,
  EntityTypeInterface,
  UrlDescriptor,
} from './types.js';

export class FieldUI {
  /**
   * Returns the route parameter map for Field UI routes.
   *
   * Keys the bundle by the entity type's bundle entity type id, falling back to
   * the literal 'bundle' for entity types that have no bundle entity.
   */
  static getRouteBundleParameter(
    entityType: EntityTypeInterface,
    bundle: string,
  ): Record<string, string> {
    const key = entityType.getBundleEntityType() || 'bundle';
    return { [key]: bundle };
  }

  /**
   * Returns the field-overview route descriptor for an entity bundle, or null
   * when the entity type does not expose a Field UI base route.
   */
  static getOverviewRouteInfo(
    entityTypeId: string,
    bundle: string,
    entityType: EntityTypeInterface,
  ): UrlDescriptor | null {
    if (!entityType.get('field_ui_base_route')) {
      return null;
    }
    return {
      routeName: `entity.${entityTypeId}.field_ui_fields`,
      routeParameters: FieldUI.getRouteBundleParameter(entityType, bundle),
      options: {},
    };
  }

  /**
   * Returns the next redirect in a multi-page sequence, threading the remaining
   * destinations into the query so the chain can continue.
   *
   * Mirrors the structured-destination branch of the PHP implementation; the
   * free-form path-string branch is intentionally deferred until a Url builder
   * exists in the port.
   */
  static getNextDestination(
    destinations: Destination[],
  ): UrlDescriptor | null {
    if (destinations.length === 0) {
      return null;
    }

    const [next, ...rest] = destinations as [Destination, ...Destination[]];

    if (typeof next === 'string') {
      // TODO(@drupaljs/routing): port UrlHelper.parse + Url.fromUserInput for
      // free-form path destinations. Until then we surface the raw path.
      const options: Record<string, unknown> =
        rest.length > 0 ? { query: { destinations: rest } } : {};
      return { routeName: '', routeParameters: { path: next }, options };
    }

    const options: Record<string, unknown> = { ...(next.options ?? {}) };
    if (rest.length > 0) {
      const existingQuery =
        (options.query as Record<string, unknown> | undefined) ?? {};
      options.query = { ...existingQuery, destinations: rest };
    }

    return {
      routeName: next.route_name,
      routeParameters: next.route_parameters ?? {},
      options,
    };
  }
}
