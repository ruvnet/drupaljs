import { describe, it, expect, vi } from 'vitest';
import {
  EntityAccessHooks,
  workspacesHelp,
  registerWorkspacesHooks,
  WORKSPACES_HELP_ROUTE,
} from './hooks.js';
import type { AccountLike, EntityLike, EntityTypeLike, WorkspaceLike } from './types.js';
import type { WorkspaceManagerInterface } from './workspace-manager-interface.js';
import type { WorkspaceInformationInterface } from './workspace-information.js';

function entityType(id: string): EntityTypeLike {
  return {
    id: () => id,
    hasWorkspaceHandler: () => true,
    getWorkspaceHandlerClass: () => 'DefaultWorkspaceHandler',
    isPublishable: () => true,
    isRevisionable: () => true,
  };
}

function entity(id: number, typeId: string): EntityLike {
  return { id: () => id, getEntityTypeId: () => typeId, getEntityType: () => entityType(typeId) };
}

const account = (id: number, perms: string[] = []): AccountLike => {
  const set = new Set(perms);
  return { id: () => id, isAuthenticated: () => true, hasPermission: (p) => set.has(p) };
};

function activeWs(owner: number): WorkspaceLike {
  return { id: () => 'stage', label: () => 'Stage', getOwnerId: () => owner, hasParent: () => false, access: () => true };
}

function managerWith(ws: WorkspaceLike | null): WorkspaceManagerInterface {
  return {
    hasActiveWorkspace: () => ws !== null,
    getActiveWorkspace: () => ws,
    setActiveWorkspace() { return this; },
    switchToLive() { return this; },
    executeInWorkspace: (_id, fn) => fn(),
    executeOutsideWorkspace: (fn) => fn(),
  };
}

const supported = (yes: boolean): WorkspaceInformationInterface => ({
  isEntityTypeSupported: () => yes,
  isEntitySupported: () => yes,
  isEntityIgnored: () => false,
  isEntityTypeIgnored: () => false,
  isEntityDeletable: () => false,
});

const deletableInfo = (deletable: boolean): WorkspaceInformationInterface => ({
  isEntityTypeSupported: () => true,
  isEntitySupported: () => true,
  isEntityIgnored: () => false,
  isEntityTypeIgnored: () => false,
  isEntityDeletable: () => deletable,
});

describe('EntityAccessHooks.entityAccess', () => {
  it('is neutral when no workspace is active', () => {
    const hooks = new EntityAccessHooks(managerWith(null), supported(true));
    expect(hooks.entityAccess(entity(1, 'node'), 'update', account(1)).isNeutral()).toBe(true);
  });

  it('is neutral for unsupported entity types', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(1)), supported(false));
    expect(hooks.entityAccess(entity(1, 'workspace'), 'update', account(1)).isNeutral()).toBe(true);
  });

  it('forbids deleting a non-deletable entity in a workspace', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(1)), deletableInfo(false));
    expect(hooks.entityAccess(entity(1, 'node'), 'delete', account(1)).isForbidden()).toBe(true);
  });

  it('does not forbid deleting a deletable entity', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(1)), deletableInfo(true));
    expect(hooks.entityAccess(entity(1, 'node'), 'delete', account(1)).isForbidden()).toBe(false);
  });

  it('bypass: allows the owner who holds the bypass permission', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(7)), supported(true));
    const r = hooks.entityAccess(entity(1, 'node'), 'update', account(7, ['bypass entity access own workspace']));
    expect(r.isAllowed()).toBe(true);
  });

  it('bypass: denies a non-owner even with the bypass permission', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(7)), supported(true));
    const r = hooks.entityAccess(entity(1, 'node'), 'update', account(8, ['bypass entity access own workspace']));
    expect(r.isAllowed()).toBe(false);
  });

  it('bypass: denies the owner without the bypass permission', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(7)), supported(true));
    const r = hooks.entityAccess(entity(1, 'node'), 'update', account(7, []));
    expect(r.isAllowed()).toBe(false);
  });
});

describe('EntityAccessHooks.entityCreateAccess', () => {
  it('is neutral when no workspace is active', () => {
    const hooks = new EntityAccessHooks(managerWith(null), supported(true));
    expect(hooks.entityCreateAccess(account(1), entityType('node')).isNeutral()).toBe(true);
  });

  it('bypass applies to create when a workspace is active', () => {
    const hooks = new EntityAccessHooks(managerWith(activeWs(7)), supported(true));
    expect(hooks.entityCreateAccess(account(7, ['bypass entity access own workspace']), entityType('node')).isAllowed()).toBe(true);
  });
});

describe('workspacesHelp', () => {
  it('returns help text for the module help route and null otherwise', () => {
    expect(workspacesHelp(WORKSPACES_HELP_ROUTE)).toMatch(/workspace/i);
    expect(workspacesHelp('some.other.route')).toBeNull();
  });
});

describe('registerWorkspacesHooks', () => {
  it('registers entity_access, entity_create_access and help under the workspaces module', () => {
    const implement = vi.fn();
    const hooks = new EntityAccessHooks(managerWith(null), supported(true));
    registerWorkspacesHooks({ implement }, hooks);
    const hookNames = implement.mock.calls.map((c) => c[1]);
    expect(hookNames).toEqual(expect.arrayContaining(['entity_access', 'entity_create_access', 'help']));
    expect(implement.mock.calls.every((c) => c[0] === 'workspaces')).toBe(true);
  });
});
