import { describe, it, expect } from 'vitest';
import { WorkspaceAccessControlHandler, WorkspaceAccessException } from './access.js';
import { DefaultWorkspaceProvider, WorkspaceProviderCollector } from './provider.js';
import type { AccountLike, WorkspaceLike } from './types.js';

const account = (perms: string[]): AccountLike => {
  const set = new Set(perms);
  return { id: () => 1, isAuthenticated: () => true, hasPermission: (p) => set.has(p) };
};

const workspace = (opts: { owner?: number; parent?: boolean } = {}): WorkspaceLike => ({
  id: () => 'stage',
  label: () => 'Stage',
  getOwnerId: () => opts.owner ?? 1,
  hasParent: () => opts.parent ?? false,
  access: () => true,
});

describe('WorkspaceAccessControlHandler', () => {
  const handler = new WorkspaceAccessControlHandler(new WorkspaceProviderCollector());

  it('checkAccess delegates to the workspace provider', () => {
    const r = handler.checkAccess(workspace({ owner: 1 }), 'view', account(['view own workspace']));
    expect(r.isAllowed()).toBe(true);
  });

  it('checkCreateAccess allows users with administer or create permission (OR)', () => {
    expect(handler.checkCreateAccess(account(['create workspace'])).isAllowed()).toBe(true);
    expect(handler.checkCreateAccess(account(['administer workspaces'])).isAllowed()).toBe(true);
    expect(handler.checkCreateAccess(account([])).isAllowed()).toBe(false);
  });
});

describe('WorkspaceAccessException', () => {
  it('is an Error subclass with a name', () => {
    const e = new WorkspaceAccessException('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('WorkspaceAccessException');
    expect(e.message).toBe('nope');
  });
});

describe('DefaultWorkspaceProvider wiring sanity', () => {
  it('the collector returns a usable default provider', () => {
    expect(new WorkspaceProviderCollector().getProvider('default')).toBeInstanceOf(DefaultWorkspaceProvider);
  });
});
