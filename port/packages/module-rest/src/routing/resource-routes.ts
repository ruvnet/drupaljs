/**
 * Route subscriber for REST-style routes — TypeScript port of
 * `Drupal\rest\Routing\ResourceRoutes`.
 *
 * On the dynamic-route build event it iterates enabled `rest_resource_config`
 * entities, asks each resource plugin for its base routes, then finalizes them:
 * sets the allowed `_format` / `_content_type_format`, the `_auth` option, a CSRF
 * requirement, and the `_rest_resource_config` default — skipping (and logging)
 * any method that lacks authentication providers or formats.
 *
 * In Drupal the plugin + storage come from the container; here they are injected
 * so this stays a pure, testable unit (TODO: wire to the real plugin manager and
 * entity storage once those packages land).
 */

import type { LoggerInterface, RouteCollection, RouteDefinition } from '../contracts.js';
import type { ResourceInterface } from '../plugin/resource-base.js';
import type { RestResourceConfigInterface } from '../entity/rest-resource-config.js';

/** Resolves the resource plugin for a given resource config. */
export type ResourcePluginResolver = (
  config: RestResourceConfigInterface,
) => ResourceInterface;

/** Methods that may carry a response body (need `_format`). */
const FORMAT_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];
/** Methods that may carry a request body (need `_content_type_format`). */
const CONTENT_TYPE_METHODS = ['POST', 'PATCH', 'PUT'];

export class ResourceRoutes {
  constructor(
    private readonly resolvePlugin: ResourcePluginResolver,
    private readonly logger: LoggerInterface,
  ) {}

  /**
   * Adds the routes of every enabled resource config into `collection`.
   * Ports ResourceRoutes::onDynamicRouteEvent().
   */
  onDynamicRouteEvent(
    collection: RouteCollection,
    resourceConfigs: RestResourceConfigInterface[],
  ): void {
    for (const config of resourceConfigs) {
      if (config.status()) {
        Object.assign(collection, this.getRoutesForResourceConfig(config));
      }
    }
  }

  /**
   * Builds and finalizes the routes for one resource config.
   * Ports ResourceRoutes::getRoutesForResourceConfig().
   */
  getRoutesForResourceConfig(config: RestResourceConfigInterface): RouteCollection {
    const plugin = this.resolvePlugin(config);
    const result: RouteCollection = {};

    for (const [name, route] of Object.entries(plugin.routes())) {
      const methods = route.methods ?? [];
      const method = methods[0];
      if (method === undefined || method === '') {
        continue;
      }

      const formats = config.getFormats(method);
      if (formats.length === 0) {
        // No formats for this method — nothing to expose.
        continue;
      }

      const auth = config.getAuthenticationProviders(method);
      if (auth.length === 0) {
        this.logger.error(
          'At least one authentication provider must be defined for resource @id',
          { '@id': config.id() },
        );
        continue;
      }

      const finalized: RouteDefinition = {
        ...route,
        requirements: { ...route.requirements },
        options: { ...route.options },
        defaults: { ...route.defaults },
      };

      finalized.requirements!._csrf_request_header_token = 'TRUE';

      if (
        FORMAT_METHODS.includes(method) &&
        finalized.requirements!._format === undefined
      ) {
        finalized.requirements!._format = formats.join('|');
      }
      if (
        CONTENT_TYPE_METHODS.includes(method) &&
        finalized.requirements!._content_type_format === undefined
      ) {
        finalized.requirements!._content_type_format = formats.join('|');
      }

      finalized.options!._auth = auth;
      finalized.defaults!._rest_resource_config = config.id();

      result[`rest.${name}`] = finalized;
    }

    return result;
  }
}
