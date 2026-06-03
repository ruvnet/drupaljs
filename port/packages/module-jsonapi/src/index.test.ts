import { describe, it, expect } from 'vitest';
import * as api from './index.js';

describe('@drupaljs/module-jsonapi public API (barrel)', () => {
  it('exports the resource-type building blocks', () => {
    expect(api.ResourceType).toBeTypeOf('function');
    expect(api.ResourceTypeAttribute).toBeTypeOf('function');
    expect(api.ResourceTypeRelationship).toBeTypeOf('function');
    expect(api.ResourceTypeRepository).toBeTypeOf('function');
    expect(api.TYPE_NAME_URI_PATH_SEPARATOR).toBe('--');
  });

  it('exports the resource identifier, spec and filter helpers', () => {
    expect(api.ResourceIdentifier).toBeTypeOf('function');
    expect(api.JsonApiSpec.SUPPORTED_SPECIFICATION_VERSION).toBe('1.1');
    expect(api.JsonApiFilter.AMONG_ALL).toBe('filter_among_all');
  });

  it('exports routes, hooks and the AccessResult contract', () => {
    expect(api.jsonapiRoutes).toBeTypeOf('function');
    expect(api.getRouteName).toBeTypeOf('function');
    expect(api.registerJsonapiHooks).toBeTypeOf('function');
    expect(api.AccessResult.allowed().isAllowed()).toBe(true);
  });

  it('wires an end-to-end slice: repository -> routes', () => {
    const repo = new api.ResourceTypeRepository([
      new api.ResourceType({ entityTypeId: 'node', bundle: 'article' }),
    ]);
    const routes = api.jsonapiRoutes(repo, '/jsonapi');
    expect(routes['jsonapi.node--article.collection']).toBeDefined();
    expect(routes['jsonapi.resource_list']).toBeDefined();
  });
});
