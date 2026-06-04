/**
 * @drupaljs/module-rest — TypeScript port of Drupal core's `rest` module.
 *
 * A faithful, minimal vertical slice of the RESTful Web Services module:
 *
 * - Responses: {@link ResourceResponse} (cacheable) and
 *   {@link ModifiedResourceResponse} (non-cacheable), porting
 *   `ResourceResponseInterface` / `ResourceResponseTrait`.
 * - Resource plugins: {@link ResourceBase} + {@link ResourceInterface}, porting
 *   permission/route generation and HTTP-method discovery.
 * - Config entity: {@link RestResourceConfig} (`rest_resource_config`), porting
 *   method/format/auth resolution for both granularities.
 * - Routing: {@link ResourceRoutes}, the dynamic-route subscriber that finalizes
 *   resource routes (`_format`, `_content_type_format`, `_auth`, CSRF).
 * - Permissions: {@link restStaticPermissions} (from rest.permissions.yml) and
 *   {@link restPermissions} (dynamic, from RestPermissions::permissions).
 * - Hooks: {@link restHelp} + {@link registerRestHooks} to wire into a
 *   `@drupaljs/hook` ModuleHandler.
 *
 * Deep dependencies (full entity/config-entity API, the plugin manager, Symfony
 * HttpFoundation/Routing, string translation, authentication) are stubbed via
 * local contracts marked with TODO; see `./contracts.ts`.
 */

// Responses
export {
  ResourceResponse,
  ModifiedResourceResponse,
  type ResourceResponseInterface,
} from './response/resource-response.js';

// Resource plugins
export {
  ResourceBase,
  type ResourceInterface,
  type ResourcePluginDefinition,
} from './plugin/resource-base.js';

// Config entity
export {
  RestResourceConfig,
  RestResourceConfigGranularity,
  type RestResourceConfigInterface,
  type RestResourceConfigValues,
  type RestResourceConfiguration,
  type RestMethodConfiguration,
} from './entity/rest-resource-config.js';

// Routing
export {
  ResourceRoutes,
  type ResourcePluginResolver,
} from './routing/resource-routes.js';

// Permissions
export { restStaticPermissions, restPermissions } from './permissions.js';

// Hooks
export { restHelp, registerRestHooks, type HookRegistrar } from './hooks.js';

// Shared local contracts (re-exported so consumers can satisfy the APIs).
export {
  type PermissionDefinition,
  type PermissionMap,
  type RouteDefinition,
  type RouteCollection,
  type LoggerInterface,
} from './contracts.js';
