import { describe, it, expect } from 'vitest';
import { ResourceType } from '../resource-type/resource-type.js';
import { ResourceTypeRelationship } from '../resource-type/resource-type-field.js';
import { ResourceTypeRepository } from '../resource-type/resource-type-repository.js';
import {
  jsonapiRoutes,
  getRouteName,
  JSON_API_ROUTE_FLAG_KEY,
} from './routes.js';

const BASE = '/jsonapi';

function repo() {
  const article = new ResourceType({
    entityTypeId: 'node',
    bundle: 'article',
    fields: [
      new ResourceTypeRelationship('uid', 'uid', true, true).withRelatableResourceTypeNames(['user--user']),
    ],
  });
  const internalThing = new ResourceType({
    entityTypeId: 'secret',
    bundle: 'secret',
    internal: true,
  });
  return new ResourceTypeRepository([article, internalThing]);
}

describe('getRouteName', () => {
  it('formats jsonapi.<type>.<routeType>', () => {
    const rt = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
    expect(getRouteName(rt, 'collection')).toBe('jsonapi.node--article.collection');
    expect(getRouteName(rt, 'individual')).toBe('jsonapi.node--article.individual');
  });
});

describe('jsonapiRoutes', () => {
  it('always emits the entry-point (resource_list) route', () => {
    const routes = jsonapiRoutes(new ResourceTypeRepository([]), BASE);
    expect(routes['jsonapi.resource_list']).toBeDefined();
    expect(routes['jsonapi.resource_list']!.path).toBe('/jsonapi');
    expect(routes['jsonapi.resource_list']!.methods).toEqual(['GET']);
  });

  it('emits collection GET + POST for a mutable, locatable resource type', () => {
    const routes = jsonapiRoutes(repo(), BASE);
    const collection = routes['jsonapi.node--article.collection'];
    const collectionPost = routes['jsonapi.node--article.collection.post'];
    expect(collection).toBeDefined();
    expect(collection!.path).toBe('/jsonapi/node/article');
    expect(collection!.methods).toEqual(['GET']);
    expect(collectionPost).toBeDefined();
    expect(collectionPost!.methods).toEqual(['POST']);
    expect(collectionPost!.requirements?._entity_create_access).toBe('node:article');
  });

  it('emits individual GET/PATCH/DELETE routes', () => {
    const routes = jsonapiRoutes(repo(), BASE);
    expect(routes['jsonapi.node--article.individual']!.path).toBe(
      '/jsonapi/node/article/{entity}',
    );
    expect(routes['jsonapi.node--article.individual']!.methods).toEqual(['GET']);
    expect(routes['jsonapi.node--article.individual.patch']!.methods).toEqual([
      'PATCH',
    ]);
    expect(routes['jsonapi.node--article.individual.delete']!.methods).toEqual([
      'DELETE',
    ]);
  });

  it('emits relationship + related routes for relationship fields', () => {
    const routes = jsonapiRoutes(repo(), BASE);
    expect(routes['jsonapi.node--article.uid.relationship.get']!.path).toBe(
      '/jsonapi/node/article/{entity}/relationships/uid',
    );
    expect(routes['jsonapi.node--article.uid.related']!.path).toBe(
      '/jsonapi/node/article/{entity}/uid',
    );
  });

  it('flags every route as belonging to JSON:API and sets the format requirement', () => {
    const routes = jsonapiRoutes(repo(), BASE);
    for (const route of Object.values(routes)) {
      expect(route.defaults?.[JSON_API_ROUTE_FLAG_KEY]).toBe(true);
      expect(route.requirements?._format).toBe('api_json');
    }
  });

  it('produces no routes for internal resource types', () => {
    const routes = jsonapiRoutes(repo(), BASE);
    const names = Object.keys(routes);
    expect(names.some((n) => n.includes('secret--secret'))).toBe(false);
  });

  it('omits collection.post / individual.patch for an immutable type', () => {
    const ro = new ResourceTypeRepository([
      new ResourceType({ entityTypeId: 'user', bundle: 'user', mutable: false }),
    ]);
    const routes = jsonapiRoutes(ro, BASE);
    expect(routes['jsonapi.user--user.collection']).toBeDefined();
    expect(routes['jsonapi.user--user.collection.post']).toBeUndefined();
    expect(routes['jsonapi.user--user.individual.patch']).toBeUndefined();
  });
});
