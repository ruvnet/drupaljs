/**
 * @drupaljs/module-jsonapi — TypeScript port of Drupal core's `jsonapi` module.
 *
 * A faithful, minimal vertical slice of the JSON:API module — the parts that
 * define the HTTP API surface as data structures, independent of the (not yet
 * ported) entity/field/serialization runtime:
 *
 * - Resource types: {@link ResourceType} (entity-type + bundle value object),
 *   {@link ResourceTypeAttribute} / {@link ResourceTypeRelationship} fields, and
 *   the {@link ResourceTypeRepository} that lists/looks them up.
 * - Resource identifiers: {@link ResourceIdentifier} with the arity / parallel /
 *   deduplication algorithms.
 * - Spec constants & validators: {@link JsonApiSpec}.
 * - Filter subsets: {@link JsonApiFilter}.
 * - Routes: {@link jsonapiRoutes} (the `Routes::routes()` dynamic route
 *   generator) and {@link getRouteName}.
 * - Hooks: the filter-access hook implementations
 *   ({@link jsonapiEntityFilterAccess}, {@link jsonapiNodeFilterAccess},
 *   {@link jsonapiUserFilterAccess}) and {@link registerJsonapiHooks} to wire
 *   them into a `@drupaljs/hook` ModuleHandler.
 *
 * Deep dependencies (normalizers/serializer, controllers, the entity/field API,
 * the build-event discovery in the repository, access checkers) are stubbed via
 * local contracts marked with TODO; see `./contracts.ts`.
 */

// Resource type metadata
export {
  ResourceType,
  TYPE_NAME_URI_PATH_SEPARATOR,
  type ResourceTypeOptions,
} from './resource-type/resource-type.js';
export {
  ResourceTypeField,
  ResourceTypeAttribute,
  ResourceTypeRelationship,
} from './resource-type/resource-type-field.js';
export {
  ResourceTypeRepository,
  type ResourceTypeRepositoryInterface,
} from './resource-type/resource-type-repository.js';

// Resource identifiers
export {
  ResourceIdentifier,
  type ResourceIdentifierMeta,
} from './json-api-resource/resource-identifier.js';

// Spec & filter constants
export { JsonApiSpec } from './json-api-spec.js';
export { JsonApiFilter, type JsonApiFilterKey } from './json-api-filter.js';

// Routes
export {
  jsonapiRoutes,
  getRouteName,
  JSON_API_ROUTE_FLAG_KEY,
  RESOURCE_TYPE_KEY,
} from './routing/routes.js';

// Hooks
export {
  jsonapiEntityFilterAccess,
  jsonapiNodeFilterAccess,
  jsonapiUserFilterAccess,
  registerJsonapiHooks,
  type FilterAccessResult,
} from './hooks.js';

// Shared local contracts (re-exported so consumers can satisfy the API).
export {
  AccessResult,
  type AccessVerdict,
  type AccountInterface,
  type EntityTypeInterface,
  type PermissionDefinition,
  type PermissionMap,
  type RouteDefinition,
  type RouteCollection,
} from './contracts.js';
