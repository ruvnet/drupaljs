/**
 * Port of `Drupal\jsonapi\Routing\Routes::routes()` (the `route_callbacks`
 * entry in jsonapi.routing.yml).
 *
 * Generates the dynamic JSON:API route collection from a
 * {@link ResourceTypeRepositoryInterface}: an entry-point route plus, for every
 * non-internal resource type, the collection / individual / relationship /
 * related routes. The Symfony `RouteCollection`/`Route` objects are modelled as
 * the local {@link RouteDefinition} shape (see contracts.ts).
 *
 * Controller targets are kept as their original `service:method` strings so the
 * shape round-trips; wire them to real controllers when those land.
 */

import type { RouteCollection, RouteDefinition } from '../contracts.js';
import type { ResourceType } from '../resource-type/resource-type.js';
import type { ResourceTypeRepositoryInterface } from '../resource-type/resource-type-repository.js';

/** Flags a route as belonging to the JSON:API module. */
export const JSON_API_ROUTE_FLAG_KEY = '_is_jsonapi';

/** The route default key carrying the resource type name. */
export const RESOURCE_TYPE_KEY = 'resource_type';

/** The service name of the primary JSON:API controller. */
const CONTROLLER_SERVICE_NAME = 'jsonapi.entity_resource';

/** Builds the `jsonapi.<typeName>.<routeType>` route name. */
export function getRouteName(
  resourceType: ResourceType,
  routeType: string,
): string {
  return `jsonapi.${resourceType.getTypeName()}.${routeType}`;
}

/** HTTP method -> relationship controller method. Ports Routes.php. */
const RELATIONSHIP_CONTROLLER_METHODS: Record<string, string> = {
  GET: 'getRelationship',
  POST: 'addToRelationshipData',
  PATCH: 'replaceRelationshipData',
  DELETE: 'removeFromRelationshipData',
};

/**
 * Generates the full JSON:API route collection.
 *
 * @param repository The resource type repository.
 * @param basePath The JSON:API base path, e.g. `/jsonapi` (leading slash, no
 *   trailing slash).
 */
export function jsonapiRoutes(
  repository: ResourceTypeRepositoryInterface,
  basePath: string,
): RouteCollection {
  const routes: RouteCollection = {};

  for (const resourceType of repository.all()) {
    Object.assign(routes, getRoutesForResourceType(resourceType, basePath));
  }

  // The entry point ("resource_list") route.
  routes['jsonapi.resource_list'] = {
    path: basePath,
    methods: ['GET'],
    defaults: { _controller: 'jsonapi.entry_point:index' },
    requirements: { _access: 'TRUE' },
  };

  // Cross-cutting requirements/defaults applied to every route. Ports the tail
  // of Routes::routes(): JSON:API media type + module flag.
  for (const route of Object.values(routes)) {
    route.defaults = { ...route.defaults, [JSON_API_ROUTE_FLAG_KEY]: true };
    route.requirements = { ...route.requirements, _format: 'api_json' };
  }

  return routes;
}

/** Builds the routes for a single resource type. */
function getRoutesForResourceType(
  resourceType: ResourceType,
  basePath: string,
): RouteCollection {
  // Internal resources have no routes.
  if (resourceType.isInternal()) {
    return {};
  }

  const routes: RouteCollection = {};
  const path = `${basePath}${resourceType.getPath()}`;
  const createRequirement = `${resourceType.getEntityTypeId()}:${resourceType.getBundle()}`;

  // Collection route (GET) — access checked in the controller.
  if (resourceType.isLocatable()) {
    routes[getRouteName(resourceType, 'collection')] = {
      path,
      methods: ['GET'],
      defaults: { _controller: `${CONTROLLER_SERVICE_NAME}:getCollection` },
      requirements: { _access: 'TRUE' },
    };
  }

  // Creation route (POST).
  if (resourceType.isMutable()) {
    routes[getRouteName(resourceType, 'collection.post')] = {
      path,
      methods: ['POST'],
      defaults: { _controller: `${CONTROLLER_SERVICE_NAME}:createIndividual` },
      requirements: {
        _entity_create_access: createRequirement,
        _csrf_request_header_token: 'TRUE',
      },
    };
  }

  Object.assign(routes, getIndividualRoutesForResourceType(resourceType, path));

  // Stamp the resource type name onto every route's defaults.
  for (const route of Object.values(routes)) {
    route.defaults = { ...route.defaults, [RESOURCE_TYPE_KEY]: resourceType.getTypeName() };
  }

  return routes;
}

/** Builds the individual + relationship + related routes for a resource type. */
function getIndividualRoutesForResourceType(
  resourceType: ResourceType,
  path: string,
): RouteCollection {
  if (!resourceType.isLocatable()) {
    return {};
  }

  const routes: RouteCollection = {};
  const individualPath = `${path}/{entity}`;

  // Individual read.
  routes[getRouteName(resourceType, 'individual')] = {
    path: individualPath,
    methods: ['GET'],
    defaults: { _controller: `${CONTROLLER_SERVICE_NAME}:getIndividual` },
    requirements: { _access: 'TRUE' },
  };

  if (resourceType.isMutable()) {
    routes[getRouteName(resourceType, 'individual.patch')] = {
      path: individualPath,
      methods: ['PATCH'],
      defaults: { _controller: `${CONTROLLER_SERVICE_NAME}:patchIndividual` },
      requirements: { _entity_access: 'entity.update', _csrf_request_header_token: 'TRUE' },
    };
    routes[getRouteName(resourceType, 'individual.delete')] = {
      path: individualPath,
      methods: ['DELETE'],
      defaults: { _controller: `${CONTROLLER_SERVICE_NAME}:deleteIndividual` },
      requirements: { _entity_access: 'entity.delete', _csrf_request_header_token: 'TRUE' },
    };
  }

  // Relationship + related routes for each relationship field.
  const relatable = resourceType.getRelatableResourceTypes();
  for (const relationshipFieldName of Object.keys(relatable)) {
    const relationshipMethods = resourceType.isMutable()
      ? ['GET', 'POST', 'PATCH', 'DELETE']
      : ['GET'];
    for (const method of relationshipMethods) {
      const fieldOperation = method === 'GET' ? 'view' : 'edit';
      routes[
        getRouteName(
          resourceType,
          `${relationshipFieldName}.relationship.${method.toLowerCase()}`,
        )
      ] = {
        path: `${path}/{entity}/relationships/${relationshipFieldName}`,
        methods: [method],
        defaults: {
          _controller: `${CONTROLLER_SERVICE_NAME}:${RELATIONSHIP_CONTROLLER_METHODS[method]}`,
          _on_relationship: true,
          related: relationshipFieldName,
        },
        requirements: {
          _jsonapi_relationship_route_access: `${relationshipFieldName}.${fieldOperation}`,
          _csrf_request_header_token: 'TRUE',
        },
      };
    }

    // Related route (GET) — only when at least one target is non-internal.
    const targets = relatable[relationshipFieldName] ?? [];
    if (targets.length > 0) {
      routes[getRouteName(resourceType, `${relationshipFieldName}.related`)] = {
        path: `${path}/{entity}/${relationshipFieldName}`,
        methods: ['GET'],
        defaults: {
          _controller: `${CONTROLLER_SERVICE_NAME}:getRelated`,
          related: relationshipFieldName,
        },
        requirements: {
          _jsonapi_relationship_route_access: `${relationshipFieldName}.view`,
        },
      };
    }
  }

  return routes;
}

export type { RouteCollection, RouteDefinition };
