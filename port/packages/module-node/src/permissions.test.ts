import { describe, it, expect } from 'vitest';
import { NodeType } from './entity/node-type.js';
import { nodePermissions, nodeTypePermissions } from './permissions.js';

describe('static node permissions', () => {
  it('exposes the core node permissions from node.permissions.yml', () => {
    const perms = nodePermissions();
    expect(perms['bypass node access']).toMatchObject({
      title: 'Bypass content access control',
      restrict_access: true,
    });
    expect(perms['access content overview']).toMatchObject({
      title: 'Access the Content overview page',
    });
    expect(perms['administer content types']?.restrict_access).toBe(true);
    expect(perms['view own unpublished content']).toBeDefined();
    expect(perms['rebuild node access permissions']?.restrict_access).toBe(true);
  });
});

describe('dynamic per-type node permissions', () => {
  it('generates the 8 per-bundle permissions for each node type', () => {
    const types = [
      new NodeType({ type: 'article', name: 'Article' }),
      new NodeType({ type: 'page', name: 'Page' }),
    ];
    const perms = nodeTypePermissions(types);

    for (const id of ['article', 'page']) {
      expect(perms[`create ${id} content`]).toBeDefined();
      expect(perms[`edit own ${id} content`]).toBeDefined();
      expect(perms[`edit any ${id} content`]).toBeDefined();
      expect(perms[`delete own ${id} content`]).toBeDefined();
      expect(perms[`delete any ${id} content`]).toBeDefined();
      expect(perms[`view ${id} revisions`]).toBeDefined();
      expect(perms[`revert ${id} revisions`]).toBeDefined();
      expect(perms[`delete ${id} revisions`]).toBeDefined();
    }
    // 8 permissions * 2 types.
    expect(Object.keys(perms)).toHaveLength(16);
  });

  it('interpolates the type label into the permission title', () => {
    const perms = nodeTypePermissions([new NodeType({ type: 'article', name: 'Article' })]);
    expect(perms['create article content']?.title).toContain('Article');
  });
});
