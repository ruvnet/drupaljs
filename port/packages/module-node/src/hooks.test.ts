import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { Node } from './entity/node.js';
import { NodeType } from './entity/node-type.js';
import { registerNodeHooks, nodeNodeAccess } from './hooks.js';
import type { AccountInterface } from './contracts.js';

function account(opts: { uid?: number; permissions?: string[] }): AccountInterface {
  const perms = new Set(opts.permissions ?? []);
  const uid = opts.uid ?? 0;
  return {
    id: () => uid,
    hasPermission: (p) => perms.has(p),
    isAuthenticated: () => uid !== 0,
  };
}

describe('registerNodeHooks', () => {
  let handler: ModuleHandler;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ node: { name: 'node' } });
    registerNodeHooks(handler);
  });

  it('registers node hook implementations under the "node" module', () => {
    expect(handler.hasImplementations('node_access')).toBe(true);
    expect(handler.hasImplementations('node_grants')).toBe(true);
    expect(handler.getImplementations('node_access')).toContain('node');
  });

  it('node_access hook is invokable through the ModuleHandler', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 5, status: false });
    const owner = account({ uid: 5, permissions: ['view own unpublished content'] });
    const result = handler.invoke('node', 'node_access', [node, 'view', owner]);
    expect(result).toBe('allowed');
  });
});

describe('nodeNodeAccess (hook_node_access)', () => {
  it('allows the owner to view their own unpublished content', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 5, status: false });
    const owner = account({ uid: 5, permissions: ['view own unpublished content'] });
    expect(nodeNodeAccess(node, 'view', owner)).toBe('allowed');
  });

  it('is neutral when the node is published', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 5, status: true });
    const anyone = account({ uid: 9, permissions: [] });
    expect(nodeNodeAccess(node, 'view', anyone)).toBe('neutral');
  });

  it('is neutral for a non-owner', () => {
    const node = new Node({ nid: 1, type: 'article', title: 'X', uid: 5, status: false });
    const other = account({ uid: 9, permissions: ['view own unpublished content'] });
    expect(nodeNodeAccess(node, 'view', other)).toBe('neutral');
  });
});

describe('node_grants registration default', () => {
  it('node_grants returns the default "all" realm grant', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ node: { name: 'node' } });
    registerNodeHooks(handler);
    const anon = account({ uid: 0, permissions: ['access content'] });
    const grants = handler.invoke('node', 'node_grants', [anon, 'view']) as Record<string, number[]>;
    expect(grants).toEqual({ all: [0] });
  });
});

describe('hook ordering integration with NodeType permissions', () => {
  it('node module can be listed alongside others without conflict', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ node: { name: 'node', weight: 0 }, user: { name: 'user', weight: -1 } });
    registerNodeHooks(handler);
    // NodeType is usable in the same module graph.
    const t = new NodeType({ type: 'article', name: 'Article' });
    expect(t.id()).toBe('article');
    expect(handler.moduleExists('node')).toBe(true);
  });
});
