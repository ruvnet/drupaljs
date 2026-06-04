import { describe, it, expect } from 'vitest';
import { DefaultWorkspaceProvider, WorkspaceProviderCollector } from './provider.js';
import type { AccountLike, WorkspaceLike } from './types.js';

function account(opts: {
  id?: number;
  authenticated?: boolean;
  perms?: string[];
}): AccountLike {
  const perms = new Set(opts.perms ?? []);
  return {
    id: () => opts.id ?? 0,
    isAuthenticated: () => opts.authenticated ?? true,
    hasPermission: (p) => perms.has(p),
  };
}

function workspace(opts: { id?: string; owner?: number; parent?: boolean }): WorkspaceLike {
  return {
    id: () => opts.id ?? 'stage',
    label: () => 'Stage',
    getOwnerId: () => opts.owner ?? 1,
    hasParent: () => opts.parent ?? false,
    access: () => true,
  };
}

describe('DefaultWorkspaceProvider.checkAccess', () => {
  const provider = new DefaultWorkspaceProvider();

  it('forbids publishing a non-top-level workspace', () => {
    const r = provider.checkAccess(workspace({ parent: true }), 'publish', account({ perms: ['administer workspaces'] }));
    expect(r.isForbidden()).toBe(true);
  });

  it('administer workspaces grants any operation on a top-level workspace', () => {
    const r = provider.checkAccess(workspace({}), 'publish', account({ perms: ['administer workspaces'] }));
    expect(r.isAllowed()).toBe(true);
  });

  it('maps update/publish to the "edit" permission family', () => {
    const acct = account({ id: 7, perms: ['edit any workspace'] });
    const r = provider.checkAccess(workspace({}), 'update', acct);
    expect(r.isAllowed()).toBe(true);
  });

  it('maps "view all revisions" to the view permission family', () => {
    const r = provider.checkAccess(workspace({}), 'view all revisions', account({ perms: ['view any workspace'] }));
    expect(r.isAllowed()).toBe(true);
  });

  it('allows "any" permission regardless of ownership', () => {
    const r = provider.checkAccess(workspace({ owner: 99 }), 'view', account({ id: 1, perms: ['view any workspace'] }));
    expect(r.isAllowed()).toBe(true);
  });

  it('falls back to the "own" permission when the user owns the workspace', () => {
    const r = provider.checkAccess(workspace({ owner: 5 }), 'delete', account({ id: 5, perms: ['delete own workspace'] }));
    expect(r.isAllowed()).toBe(true);
  });

  it('denies "own" permission to a non-owner', () => {
    const r = provider.checkAccess(workspace({ owner: 5 }), 'delete', account({ id: 6, perms: ['delete own workspace'] }));
    expect(r.isAllowed()).toBe(false);
  });

  it('exposes the default id', () => {
    expect(DefaultWorkspaceProvider.getId()).toBe('default');
    expect(provider.getId()).toBe('default');
  });
});

describe('WorkspaceProviderCollector', () => {
  it('returns a registered provider by id and falls back to default', () => {
    const collector = new WorkspaceProviderCollector();
    const def = collector.getProvider('default');
    expect(def.getId()).toBe('default');
    // Unknown ids fall back to the default provider.
    expect(collector.getProvider('missing').getId()).toBe('default');
  });
});
