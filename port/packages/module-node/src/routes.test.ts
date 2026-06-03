import { describe, it, expect } from 'vitest';
import { nodeRoutes } from './routes.js';

describe('node routes', () => {
  it('defines the content-type collection route guarded by a permission', () => {
    const routes = nodeRoutes();
    const collection = routes['entity.node_type.collection'];
    expect(collection?.path).toBe('/admin/structure/types');
    expect(collection?.requirements?._permission).toBe('administer content types');
  });

  it('defines the rebuild-permissions route', () => {
    const routes = nodeRoutes();
    expect(routes['node.configure_rebuild_confirm']?.path).toBe('/admin/reports/status/rebuild');
    expect(routes['node.configure_rebuild_confirm']?.requirements?._permission).toBe(
      'rebuild node access permissions',
    );
  });

  it('defines the version-history route with an entity-access requirement', () => {
    const routes = nodeRoutes();
    const history = routes['entity.node.version_history'];
    expect(history?.path).toBe('/node/{node}/revisions');
    expect(history?.requirements?._entity_access).toBe('node.view all revisions');
  });
});
