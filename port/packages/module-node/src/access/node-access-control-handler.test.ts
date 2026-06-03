import { describe, it, expect, beforeEach } from 'vitest';
import { Node } from '../entity/node.js';
import { NodeAccessControlHandler } from './node-access-control-handler.js';
import type { AccountInterface } from '../contracts.js';

/** Builds a mock account with a fixed permission set. */
function account(opts: {
  uid?: number;
  permissions?: string[];
}): AccountInterface {
  const perms = new Set(opts.permissions ?? []);
  const uid = opts.uid ?? 0;
  return {
    id: () => uid,
    hasPermission: (p: string) => perms.has(p),
    isAuthenticated: () => uid !== 0,
  };
}

describe('NodeAccessControlHandler.access', () => {
  let handler: NodeAccessControlHandler;
  let node: Node;

  beforeEach(() => {
    handler = new NodeAccessControlHandler();
    node = new Node({ nid: 1, type: 'article', title: 'X', uid: 7, status: true });
  });

  it("'bypass node access' allows non-revision operations", () => {
    const acct = account({ uid: 2, permissions: ['bypass node access'] });
    expect(handler.access(node, 'view', acct).isAllowed()).toBe(true);
    expect(handler.access(node, 'update', acct).isAllowed()).toBe(true);
  });

  it("forbids when the account lacks 'access content'", () => {
    const acct = account({ uid: 2, permissions: [] });
    expect(handler.access(node, 'view', acct).isForbidden()).toBe(true);
  });

  it('allows viewing a published node with access content', () => {
    const acct = account({ uid: 2, permissions: ['access content'] });
    expect(handler.access(node, 'view', acct).isAllowed()).toBe(true);
  });

  it('does not allow viewing an unpublished node without the own-unpublished permission', () => {
    node.setPublished(false);
    const acct = account({ uid: 7, permissions: ['access content'] });
    expect(handler.access(node, 'view', acct).isAllowed()).toBe(false);
  });

  it("allows the owner to view their own unpublished content", () => {
    node.setPublished(false);
    const owner = account({
      uid: 7,
      permissions: ['access content', 'view own unpublished content'],
    });
    expect(handler.access(node, 'view', owner).isAllowed()).toBe(true);
  });

  it("denies a non-owner viewing unpublished content even with the permission", () => {
    node.setPublished(false);
    const other = account({
      uid: 99,
      permissions: ['access content', 'view own unpublished content'],
    });
    expect(handler.access(node, 'view', other).isAllowed()).toBe(false);
  });

  it('never grants own-unpublished view to anonymous users', () => {
    node.setPublished(false);
    const anon = account({
      uid: 0,
      permissions: ['access content', 'view own unpublished content'],
    });
    expect(handler.access(node, 'view', anon).isAllowed()).toBe(false);
  });
});

describe('NodeAccessControlHandler.createAccess', () => {
  let handler: NodeAccessControlHandler;

  beforeEach(() => {
    handler = new NodeAccessControlHandler();
  });

  it("'bypass node access' allows create", () => {
    const acct = account({ uid: 2, permissions: ['bypass node access'] });
    expect(handler.createAccess('article', acct).isAllowed()).toBe(true);
  });

  it("requires 'access content' to create", () => {
    const acct = account({ uid: 2, permissions: [] });
    expect(handler.createAccess('article', acct).isForbidden()).toBe(true);
  });

  it("grants create with the bundle 'create X content' permission", () => {
    const acct = account({
      uid: 2,
      permissions: ['access content', 'create article content'],
    });
    expect(handler.createAccess('article', acct).isAllowed()).toBe(true);
  });

  it('denies create without the bundle permission', () => {
    const acct = account({ uid: 2, permissions: ['access content'] });
    expect(handler.createAccess('article', acct).isAllowed()).toBe(false);
  });
});

describe('NodeAccessControlHandler.checkFieldAccess', () => {
  let handler: NodeAccessControlHandler;

  beforeEach(() => {
    handler = new NodeAccessControlHandler();
  });

  it("forbids editing read-only revision fields", () => {
    const acct = account({ uid: 1, permissions: ['administer nodes'] });
    expect(handler.checkFieldAccess('edit', 'revision_timestamp', acct).isForbidden()).toBe(true);
    expect(handler.checkFieldAccess('edit', 'revision_uid', acct).isForbidden()).toBe(true);
  });

  it("allows editing administrative fields only with 'administer nodes'", () => {
    const admin = account({ uid: 1, permissions: ['administer nodes'] });
    const plain = account({ uid: 2, permissions: [] });
    for (const field of ['uid', 'created', 'promote', 'sticky']) {
      expect(handler.checkFieldAccess('edit', field, admin).isAllowed()).toBe(true);
      expect(handler.checkFieldAccess('edit', field, plain).isAllowed()).toBe(false);
    }
  });

  it("allows editing status with either published-status or administer-nodes permission", () => {
    const a = account({ uid: 1, permissions: ['administer node published status'] });
    const b = account({ uid: 2, permissions: ['administer nodes'] });
    const c = account({ uid: 3, permissions: [] });
    expect(handler.checkFieldAccess('edit', 'status', a).isAllowed()).toBe(true);
    expect(handler.checkFieldAccess('edit', 'status', b).isAllowed()).toBe(true);
    expect(handler.checkFieldAccess('edit', 'status', c).isAllowed()).toBe(false);
  });
});

describe('NodeAccessControlHandler.acquireGrants', () => {
  it('returns the default all/view grant for a published node with no module grants', () => {
    const handler = new NodeAccessControlHandler();
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1, status: true });
    const grants = handler.acquireGrants(node);
    expect(grants).toEqual([
      { realm: 'all', gid: 0, grant_view: 1, grant_update: 0, grant_delete: 0 },
    ]);
  });

  it('returns no grants for an unpublished node with no module grants', () => {
    const handler = new NodeAccessControlHandler();
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 1, status: false });
    expect(handler.acquireGrants(node)).toEqual([]);
  });
});
