import { describe, it, expect } from 'vitest';
import { restStaticPermissions, restPermissions } from './permissions.js';
import { RestResourceConfig, RestResourceConfigGranularity } from './entity/rest-resource-config.js';
import { ResourceBase, type ResourcePluginDefinition } from './plugin/resource-base.js';

class NodeResource extends ResourceBase {
  get(): unknown {
    return null;
  }
}
const definition: ResourcePluginDefinition = { id: 'entity:node', label: 'Node' };

describe('restStaticPermissions', () => {
  it('declares the admin permission from rest.permissions.yml', () => {
    const permissions = restStaticPermissions();
    expect(permissions['administer rest resources']).toEqual({
      title: 'Administer REST resource configuration',
    });
  });
});

describe('restPermissions (dynamic, from RestPermissions::permissions)', () => {
  it('merges plugin permissions and tags each with a config dependency', () => {
    const config = new RestResourceConfig({
      id: 'entity.node',
      granularity: RestResourceConfigGranularity.RESOURCE,
      configuration: {},
    });
    const resolvePlugin = () =>
      new NodeResource({}, 'entity:node', definition, ['json'], { error() {} });

    const permissions = restPermissions([config], resolvePlugin);
    expect(permissions['restful get entity:node']).toEqual({
      title: 'Access GET on Node resource',
      dependencies: { config: ['rest.resource.entity.node'] },
    });
  });
});
