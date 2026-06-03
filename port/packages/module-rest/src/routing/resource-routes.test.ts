import { describe, it, expect, vi } from 'vitest';
import { ResourceRoutes } from './resource-routes.js';
import { RestResourceConfig, RestResourceConfigGranularity } from '../entity/rest-resource-config.js';
import { ResourceBase, type ResourcePluginDefinition } from '../plugin/resource-base.js';
import type { RouteCollection } from '../contracts.js';

class NodeResource extends ResourceBase {
  get(): unknown {
    return null;
  }
  post(): unknown {
    return null;
  }
}

const definition: ResourcePluginDefinition = { id: 'entity:node', label: 'Node' };

function plugin(): NodeResource {
  return new NodeResource({}, 'entity:node', definition, ['json'], { error() {} });
}

function config(overrides: Record<string, unknown> = {}): RestResourceConfig {
  return new RestResourceConfig({
    id: 'entity.node',
    status: true,
    granularity: RestResourceConfigGranularity.RESOURCE,
    configuration: {
      methods: ['GET', 'POST'],
      formats: ['json'],
      authentication: ['basic_auth'],
    },
    ...overrides,
  });
}

describe('ResourceRoutes.getRoutesForResourceConfig', () => {
  it('exposes routes for configured methods, prefixed `rest.`', () => {
    const subscriber = new ResourceRoutes(() => plugin(), { error() {} });
    const routes: RouteCollection = subscriber.getRoutesForResourceConfig(config());
    expect(Object.keys(routes).sort()).toEqual(['rest.entity.node.GET', 'rest.entity.node.POST']);
  });

  it('adds _format, _content_type_format, auth option and csrf requirement', () => {
    const subscriber = new ResourceRoutes(() => plugin(), { error() {} });
    const routes = subscriber.getRoutesForResourceConfig(config());

    const get = routes['rest.entity.node.GET']!;
    expect(get.requirements?._format).toBe('json');
    expect(get.requirements?._csrf_request_header_token).toBe('TRUE');
    // GET is safe — no content-type requirement.
    expect(get.requirements?._content_type_format).toBeUndefined();
    expect(get.options?._auth).toEqual(['basic_auth']);
    expect(get.defaults?._rest_resource_config).toBe('entity.node');

    // POST accepts a request body — content-type format is set.
    const post = routes['rest.entity.node.POST']!;
    expect(post.requirements?._content_type_format).toBe('json');
  });

  it('skips a method that has no authentication providers and logs an error', () => {
    const logger = { error: vi.fn() };
    const subscriber = new ResourceRoutes(() => plugin(), logger);
    const routes = subscriber.getRoutesForResourceConfig(
      config({
        configuration: { methods: ['GET'], formats: ['json'], authentication: [] },
      }),
    );
    expect(Object.keys(routes)).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('authentication provider'),
      expect.objectContaining({ '@id': 'entity.node' }),
    );
  });

  it('skips a method that has no formats', () => {
    const subscriber = new ResourceRoutes(() => plugin(), { error() {} });
    const routes = subscriber.getRoutesForResourceConfig(
      config({
        configuration: { methods: ['GET'], formats: [], authentication: ['basic_auth'] },
      }),
    );
    expect(Object.keys(routes)).toEqual([]);
  });
});

describe('ResourceRoutes.onDynamicRouteEvent', () => {
  it('only collects routes from enabled (status===true) resource configs', () => {
    const subscriber = new ResourceRoutes(() => plugin(), { error() {} });
    const enabled = config({ id: 'entity.node', status: true });
    const disabled = config({ id: 'entity.user', status: false });
    const collection: RouteCollection = {};
    subscriber.onDynamicRouteEvent(collection, [enabled, disabled]);
    expect(Object.keys(collection).sort()).toEqual([
      'rest.entity.node.GET',
      'rest.entity.node.POST',
    ]);
  });
});
