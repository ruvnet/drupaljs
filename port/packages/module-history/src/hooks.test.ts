import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  registerHistoryHooks,
  historyHelp,
  historyCron,
  historyNodeViewAlter,
  historyNodeDelete,
  historyUserCancel,
  historyUserDelete,
  USER_CANCEL_REASSIGN,
  MODULE_NAME,
  type NodeViewBuild,
  type NodeLike,
  type ViewDisplay,
} from './hooks.js';
import {
  HistoryRepository,
  type HistoryStorage,
  type HistoryAccount,
  type TimeService,
} from './history-repository.js';

const REQUEST_TIME = 1_700_000_000;
const time: TimeService = { getRequestTime: () => REQUEST_TIME };

function storage(): HistoryStorage {
  return {
    readTimestamps: () => [],
    writeTimestamp: vi.fn(),
    deleteOlderThan: vi.fn(),
    deleteByNid: vi.fn(),
    deleteByUid: vi.fn(),
  };
}

const authed: HistoryAccount = { id: () => 7, isAuthenticated: () => true };
const anon: HistoryAccount = { id: () => null, isAuthenticated: () => false };

function node(id: number, isNew = false): NodeLike {
  return { id: () => id, isNew: () => isNew };
}
const fullDisplay: ViewDisplay = { getOriginalMode: () => 'full' };
const teaserDisplay: ViewDisplay = { getOriginalMode: () => 'teaser' };

describe('historyHelp', () => {
  it('returns help text for the history help page', () => {
    expect(historyHelp('help.page.history')).toContain('History module');
  });
  it('returns null for other routes', () => {
    expect(historyHelp('help.page.node')).toBeNull();
  });
});

describe('historyCron', () => {
  it('deletes rows older than the read limit', () => {
    const s = storage();
    const repo = new HistoryRepository(s, authed, time);
    historyCron(s, repo);
    expect(s.deleteOlderThan).toHaveBeenCalledWith(REQUEST_TIME - 30 * 24 * 60 * 60);
  });
});

describe('historyNodeViewAlter', () => {
  it('tags the node id when comment is installed', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5), fullDisplay, authed, true);
    expect(build.attributes?.['data-history-node-id']).toBe(5);
  });

  it('does not tag the node id when comment is not installed', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5), fullDisplay, authed, false);
    expect(build.attributes?.['data-history-node-id']).toBeUndefined();
  });

  it('attaches mark-as-read for authenticated full views', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5), fullDisplay, authed, true);
    expect(build.attached?.library).toContain('history/mark-as-read');
    expect(build.cache?.contexts).toContain('user.roles:authenticated');
    const settings = build.attached?.drupalSettings?.['history'] as Record<string, unknown>;
    expect((settings['nodesToMarkAsRead'] as Record<number, boolean>)[5]).toBe(true);
  });

  it('does not attach mark-as-read for anonymous users', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5), fullDisplay, anon, true);
    expect(build.attached?.library ?? []).not.toContain('history/mark-as-read');
  });

  it('skips the read attachment for non-full displays', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5), teaserDisplay, authed, true);
    expect(build.cache?.contexts ?? []).not.toContain('user.roles:authenticated');
  });

  it('returns early for new nodes', () => {
    const build: NodeViewBuild = {};
    historyNodeViewAlter(build, node(5, true), fullDisplay, authed, true);
    expect(build.cache).toBeUndefined();
  });
});

describe('historyNodeDelete / userDelete / userCancel', () => {
  it('deletes history rows for a node', () => {
    const s = storage();
    historyNodeDelete(s, node(9));
    expect(s.deleteByNid).toHaveBeenCalledWith(9);
  });

  it('deletes history rows for a deleted user', () => {
    const s = storage();
    historyUserDelete(s, 42);
    expect(s.deleteByUid).toHaveBeenCalledWith(42);
  });

  it('deletes history rows only for the reassign cancel method', () => {
    const s = storage();
    historyUserCancel(s, 42, USER_CANCEL_REASSIGN);
    expect(s.deleteByUid).toHaveBeenCalledWith(42);
  });

  it('does nothing for other cancel methods', () => {
    const s = storage();
    historyUserCancel(s, 42, 'user_cancel_block');
    expect(s.deleteByUid).not.toHaveBeenCalled();
  });
});

describe('registerHistoryHooks', () => {
  it('registers all hooks on the module handler and they fire in order', () => {
    const mh = new ModuleHandler();
    mh.setModuleList({ history: { name: MODULE_NAME } });
    const s = storage();
    const repo = new HistoryRepository(s, authed, time);

    registerHistoryHooks(mh, {
      storage: s,
      repository: repo,
      currentUser: authed,
      commentInstalled: () => true,
    });

    expect(mh.hasImplementations('help')).toBe(true);
    expect(mh.hasImplementations('cron')).toBe(true);
    expect(mh.hasImplementations('node_view_alter')).toBe(true);
    expect(mh.hasImplementations('node_delete')).toBe(true);
    expect(mh.hasImplementations('user_cancel')).toBe(true);
    expect(mh.hasImplementations('user_delete')).toBe(true);

    // Invoking cron through the handler triggers the cleanup.
    mh.invoke(MODULE_NAME, 'cron');
    expect(s.deleteOlderThan).toHaveBeenCalledWith(REQUEST_TIME - 30 * 24 * 60 * 60);

    // node_delete via handler.
    mh.invoke(MODULE_NAME, 'node_delete', [node(3)]);
    expect(s.deleteByNid).toHaveBeenCalledWith(3);
  });
});
