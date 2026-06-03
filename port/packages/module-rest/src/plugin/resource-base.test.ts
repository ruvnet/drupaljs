import { describe, it, expect } from 'vitest';
import { ResourceBase, type ResourcePluginDefinition } from './resource-base.js';

/**
 * A test resource exposing GET + POST. Method presence (Drupal's
 * `method_exists($this, strtolower($method))`) is modelled by defining the
 * lowercased HTTP-method members.
 */
class TestResource extends ResourceBase {
  get(): unknown {
    return null;
  }

  post(): unknown {
    return null;
  }
}

const definition: ResourcePluginDefinition = {
  id: 'entity:node',
  label: 'Node',
};

function makeResource(): TestResource {
  return new TestResource({}, 'entity:node', definition, ['json'], {
    error() {},
  });
}

describe('ResourceBase.availableMethods', () => {
  it('only reports HTTP methods whose handler exists on the plugin', () => {
    const resource = makeResource();
    expect(resource.availableMethods().sort()).toEqual(['GET', 'POST']);
  });
});

describe('ResourceBase.permissions', () => {
  it('generates one permission per available method', () => {
    const permissions = makeResource().permissions();
    expect(Object.keys(permissions).sort()).toEqual([
      'restful get entity:node',
      'restful post entity:node',
    ]);
    expect(permissions['restful get entity:node']).toEqual({
      title: 'Access GET on Node resource',
    });
  });
});

describe('ResourceBase.routes', () => {
  it('derives route name and paths from the plugin id', () => {
    const routes = makeResource().routes();
    // POST uses the create path; GET uses the canonical path with {id}.
    expect(routes['entity.node.GET']).toMatchObject({
      path: '/entity/node/{id}',
      methods: ['GET'],
      defaults: { _controller: 'Drupal\\rest\\RequestHandler::handle' },
    });
    expect(routes['entity.node.POST']).toMatchObject({
      path: '/entity/node',
      methods: ['POST'],
    });
  });

  it('adds a _permission requirement when the matching permission exists', () => {
    const routes = makeResource().routes();
    expect(routes['entity.node.GET']!.requirements).toEqual({
      _access: 'TRUE',
      _permission: 'restful get entity:node',
    });
  });

  it('honours explicit uri_paths from the definition', () => {
    class PathResource extends ResourceBase {
      get(): unknown {
        return null;
      }
    }
    const resource = new PathResource(
      {},
      'entity:node',
      {
        id: 'entity:node',
        label: 'Node',
        uri_paths: { canonical: '/custom/{id}', create: '/custom' },
      },
      ['json'],
      { error() {} },
    );
    expect(resource.routes()['entity.node.GET']!.path).toBe('/custom/{id}');
  });
});
