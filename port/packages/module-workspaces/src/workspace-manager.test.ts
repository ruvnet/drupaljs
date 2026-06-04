import { describe, it, expect, vi } from 'vitest';
import { WorkspaceManager } from './workspace-manager.js';
import { WorkspaceSwitchEvent } from './events.js';
import { WorkspaceAccessException } from './access.js';
import type {
  EntityTypeManagerLike,
  RequestStackLike,
  WorkspaceLike,
} from './types.js';
import type { WorkspaceNegotiatorInterface } from './negotiator.js';

function workspace(id: string, viewable = true): WorkspaceLike {
  return {
    id: () => id,
    label: () => id,
    getOwnerId: () => 1,
    hasParent: () => false,
    access: (op) => (op === 'view' ? viewable : true),
  };
}

function entityTypeManager(map: Record<string, WorkspaceLike>): EntityTypeManagerLike {
  return {
    getStorage: () => ({ load: (id) => map[id] ?? null }),
  };
}

const requestStack: RequestStackLike = { getCurrentRequest: () => ({ query: { get: () => null } }) };

function negotiator(opts: {
  applies?: boolean;
  id?: string | null;
}): WorkspaceNegotiatorInterface & { set: ReturnType<typeof vi.fn>; unset: ReturnType<typeof vi.fn> } {
  const set = vi.fn();
  const unset = vi.fn();
  return {
    set,
    unset,
    applies: () => opts.applies ?? true,
    getActiveWorkspaceId: () => opts.id ?? null,
    setActiveWorkspace: set,
    unsetActiveWorkspace: unset,
  };
}

describe('WorkspaceManager.getActiveWorkspace', () => {
  it('returns null when no negotiator yields a workspace', () => {
    const mgr = new WorkspaceManager(requestStack, [negotiator({ id: null })], entityTypeManager({}), { dispatch: () => {} });
    expect(mgr.getActiveWorkspace()).toBeNull();
    expect(mgr.hasActiveWorkspace()).toBe(false);
  });

  it('loads, view-checks and selects the negotiated workspace', () => {
    const stage = workspace('stage', true);
    const neg = negotiator({ id: 'stage' });
    const mgr = new WorkspaceManager(requestStack, [neg], entityTypeManager({ stage }), { dispatch: () => {} });
    expect(mgr.getActiveWorkspace()).toBe(stage);
    expect(mgr.hasActiveWorkspace()).toBe(true);
    // The selected negotiator is notified.
    expect(neg.set).toHaveBeenCalledWith(stage);
  });

  it('skips a negotiated workspace the user cannot view', () => {
    const stage = workspace('stage', false);
    const mgr = new WorkspaceManager(requestStack, [negotiator({ id: 'stage' })], entityTypeManager({ stage }), { dispatch: () => {} });
    expect(mgr.getActiveWorkspace()).toBeNull();
  });

  it('memoises the resolved workspace', () => {
    const load = vi.fn((id: string) => workspace(id));
    const etm: EntityTypeManagerLike = { getStorage: () => ({ load }) };
    const mgr = new WorkspaceManager(requestStack, [negotiator({ id: 'stage' })], etm, { dispatch: () => {} });
    mgr.getActiveWorkspace();
    mgr.getActiveWorkspace();
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('WorkspaceManager.setActiveWorkspace / switchToLive', () => {
  it('dispatches a switch event and persists on the first applicable negotiator', () => {
    const dispatch = vi.fn();
    const neg = negotiator({ applies: true });
    const mgr = new WorkspaceManager(requestStack, [neg], entityTypeManager({}), { dispatch });
    const stage = workspace('stage');
    mgr.setActiveWorkspace(stage);
    expect(mgr.getActiveWorkspace()).toBe(stage);
    expect(neg.set).toHaveBeenCalledWith(stage);
    expect(dispatch.mock.calls[0]?.[0]).toBeInstanceOf(WorkspaceSwitchEvent);
  });

  it('does not persist when persist=false', () => {
    const neg = negotiator({ applies: true });
    const mgr = new WorkspaceManager(requestStack, [neg], entityTypeManager({}), { dispatch: () => {} });
    mgr.setActiveWorkspace(workspace('stage'), false);
    expect(neg.set).not.toHaveBeenCalled();
  });

  it('throws WorkspaceAccessException when switching to an unviewable workspace', () => {
    const mgr = new WorkspaceManager(requestStack, [negotiator({})], entityTypeManager({}), { dispatch: () => {} });
    expect(() => mgr.setActiveWorkspace(workspace('stage', false))).toThrow(WorkspaceAccessException);
  });

  it('switchToLive clears the active workspace and notifies all negotiators', () => {
    const neg = negotiator({});
    const mgr = new WorkspaceManager(requestStack, [neg], entityTypeManager({}), { dispatch: () => {} });
    mgr.setActiveWorkspace(workspace('stage'), false);
    mgr.switchToLive();
    expect(mgr.getActiveWorkspace()).toBeNull();
    expect(neg.unset).toHaveBeenCalled();
  });
});

describe('WorkspaceManager.executeInWorkspace / executeOutsideWorkspace', () => {
  it('runs a callback in a workspace and restores the previous state', () => {
    const stage = workspace('stage');
    const mgr = new WorkspaceManager(requestStack, [negotiator({ id: null })], entityTypeManager({ stage }), { dispatch: () => {} });
    const seen = mgr.executeInWorkspace('stage', () => mgr.getActiveWorkspace()?.id());
    expect(seen).toBe('stage');
    expect(mgr.getActiveWorkspace()).toBeNull();
  });

  it('throws when the requested workspace does not exist', () => {
    const mgr = new WorkspaceManager(requestStack, [negotiator({})], entityTypeManager({}), { dispatch: () => {} });
    expect(() => mgr.executeInWorkspace('missing', () => 1)).toThrow(/does not exist/);
  });

  it('runs a callback outside the active workspace and restores it', () => {
    const stage = workspace('stage');
    const mgr = new WorkspaceManager(requestStack, [negotiator({})], entityTypeManager({ stage }), { dispatch: () => {} });
    mgr.setActiveWorkspace(stage, false);
    const seen = mgr.executeOutsideWorkspace(() => mgr.getActiveWorkspace());
    expect(seen).toBeNull();
    expect(mgr.getActiveWorkspace()).toBe(stage);
  });
});
