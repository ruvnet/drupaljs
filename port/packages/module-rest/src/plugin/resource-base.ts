/**
 * Resource plugin contracts and base class — TypeScript port of
 * `Drupal\rest\Plugin\ResourceInterface` and `Drupal\rest\Plugin\ResourceBase`.
 *
 * Drupal discovers HTTP-method handlers via `method_exists($this, 'get')` etc.
 * The TS port models the same convention: a concrete resource defines the
 * lowercased HTTP-method members it supports (`get()`, `post()`, ...), and
 * {@link ResourceBase.availableMethods} reflects over the instance to find them.
 */

import type { LoggerInterface, PermissionMap, RouteCollection } from '../contracts.js';

/**
 * The relevant subset of a `#[RestResource(...)]` plugin definition.
 * Field names mirror the PHP attribute / annotation keys.
 */
export interface ResourcePluginDefinition {
  /** Plugin id, e.g. `entity:node`. */
  id: string;
  /** Human-readable label used in generated permission titles. */
  label: string;
  /**
   * Optional explicit URI paths. When omitted they are derived from the plugin
   * id (`:` -> `/`): `canonical` becomes `/<id>/{id}`, `create` becomes `/<id>`.
   */
  uri_paths?: {
    canonical?: string;
    create?: string;
  };
}

/** Ports `Drupal\rest\Plugin\ResourceInterface`. */
export interface ResourceInterface {
  /** A collection of routes (with path/method info) for this resource. */
  routes(): RouteCollection;
  /** Permissions suitable for a `.permissions.yml` file. */
  permissions(): PermissionMap;
  /** The available HTTP request methods on this plugin, e.g. ['GET','POST']. */
  availableMethods(): string[];
}

/** The full set of HTTP request methods Drupal probes for handlers. */
const REQUEST_METHODS = [
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'TRACE',
  'OPTIONS',
  'CONNECT',
  'PATCH',
] as const;

/**
 * Common base class for resource plugins.
 *
 * Note: the base `permissions()` generates one permission per available method.
 * Resources with their own access control should override it (return `{}`).
 *
 * Ports `Drupal\rest\Plugin\ResourceBase`.
 */
export abstract class ResourceBase implements ResourceInterface {
  protected readonly pluginId: string;
  protected readonly pluginDefinition: ResourcePluginDefinition;
  protected readonly serializerFormats: string[];
  protected readonly logger: LoggerInterface;

  constructor(
    _configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: ResourcePluginDefinition,
    serializerFormats: string[],
    logger: LoggerInterface,
  ) {
    this.pluginId = pluginId;
    this.pluginDefinition = pluginDefinition;
    this.serializerFormats = serializerFormats;
    this.logger = logger;
  }

  getPluginDefinition(): ResourcePluginDefinition {
    return this.pluginDefinition;
  }

  /**
   * Generates one permission per available method, e.g.
   * `restful get entity:node` -> "Access GET on Node resource".
   *
   * Ports ResourceBase::permissions().
   */
  permissions(): PermissionMap {
    const permissions: PermissionMap = {};
    const label = this.pluginDefinition.label;
    for (const method of this.availableMethods()) {
      const lowered = method.toLowerCase();
      permissions[`restful ${lowered} ${this.pluginId}`] = {
        title: `Access ${method} on ${label} resource`,
      };
    }
    return permissions;
  }

  /**
   * Builds the route collection for this resource. POST uses the create path;
   * all other methods use the canonical path. Route names are
   * `<plugin id with ':' -> '.'>.<METHOD>`.
   *
   * Ports ResourceBase::routes() (the `_format`/`_content_type_format`
   * requirements are added later by ResourceRoutes, faithful to Drupal).
   */
  routes(): RouteCollection {
    const collection: RouteCollection = {};
    const definition = this.pluginDefinition;

    const canonicalPath =
      definition.uri_paths?.canonical ?? `/${this.pluginId.replaceAll(':', '/')}/{id}`;
    const createPath =
      definition.uri_paths?.create ?? `/${this.pluginId.replaceAll(':', '/')}`;
    const routeName = this.pluginId.replaceAll(':', '.');

    for (const method of this.availableMethods()) {
      const path = method === 'POST' ? createPath : canonicalPath;
      collection[`${routeName}.${method}`] = this.getBaseRoute(path, method);
    }
    return collection;
  }

  /**
   * Reports the HTTP methods whose handler exists on the concrete plugin.
   * Ports ResourceBase::availableMethods() + method_exists() probing.
   */
  availableMethods(): string[] {
    const available: string[] = [];
    for (const method of REQUEST_METHODS) {
      const member = method.toLowerCase();
      if (typeof (this as unknown as Record<string, unknown>)[member] === 'function') {
        available.push(method);
      }
    }
    return available;
  }

  /** Ports ResourceBase::getBaseRoute(). */
  protected getBaseRoute(path: string, method: string) {
    return {
      path,
      defaults: { _controller: 'Drupal\\rest\\RequestHandler::handle' },
      requirements: this.getBaseRouteRequirements(method),
      options: {} as Record<string, unknown>,
      methods: [method],
    };
  }

  /** Ports ResourceBase::getBaseRouteRequirements(). */
  protected getBaseRouteRequirements(method: string): Record<string, string> {
    const lower = method.toLowerCase();
    // Default to granting access to everyone so the access manager always has a
    // check to run; tighten with a _permission when a matching one exists.
    const requirements: Record<string, string> = { _access: 'TRUE' };
    const permission = `restful ${lower} ${this.pluginId}`;
    if (permission in this.permissions()) {
      requirements._permission = permission;
    }
    return requirements;
  }
}
