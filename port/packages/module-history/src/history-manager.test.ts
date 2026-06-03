import { describe, it, expect, vi } from 'vitest';
import { HistoryManager, type NewCommentCounter, type ModuleExistsProbe, type EntityLike } from './history-manager.js';
import {
  HistoryRepository,
  type HistoryStorage,
  type HistoryAccount,
  type TimeService,
  type HistoryRow,
} from './history-repository.js';

const REQUEST_TIME = 1_700_000_000;
const time: TimeService = { getRequestTime: () => REQUEST_TIME };

function makeStorage(rows: HistoryRow[] = []): HistoryStorage {
  return {
    readTimestamps: (uid, nids) => rows.filter((r) => r.uid === uid && nids.includes(r.nid)),
    writeTimestamp: vi.fn(),
    deleteOlderThan: vi.fn(),
    deleteByNid: vi.fn(),
    deleteByUid: vi.fn(),
  };
}

function account(authenticated: boolean): HistoryAccount {
  return { id: () => 7, isAuthenticated: () => authenticated };
}

function node(id: number): EntityLike {
  return { id: () => id, getEntityTypeId: () => 'node' };
}

const commentInstalled: ModuleExistsProbe = { moduleExists: (m) => m === 'comment' };
const commentMissing: ModuleExistsProbe = { moduleExists: () => false };

function counter(returns: number): NewCommentCounter {
  return { countNewComments: vi.fn(() => returns) };
}

function manager(opts: {
  auth?: boolean;
  modules?: ModuleExistsProbe;
  rows?: HistoryRow[];
  count?: number;
}) {
  const repo = new HistoryRepository(makeStorage(opts.rows ?? []), account(opts.auth ?? true), time);
  const c = counter(opts.count ?? 3);
  const m = new HistoryManager(account(opts.auth ?? true), opts.modules ?? commentInstalled, repo, c);
  return { m, c, repo };
}

describe('HistoryManager.getCountNewComments', () => {
  it('returns false for anonymous users', () => {
    const { m } = manager({ auth: false });
    expect(m.getCountNewComments(node(1))).toBe(false);
  });

  it('returns false when the comment module is not installed', () => {
    const { m } = manager({ modules: commentMissing });
    expect(m.getCountNewComments(node(1))).toBe(false);
  });

  it('returns the counter result for an authenticated user', () => {
    const { m } = manager({ count: 5 });
    expect(m.getCountNewComments(node(1))).toBe(5);
  });

  it('counts from the user last-view timestamp when above the read limit', () => {
    const recent = REQUEST_TIME - 60; // within 30 days
    const { m, c } = manager({ rows: [{ uid: 7, nid: 1, timestamp: recent }] });
    m.getCountNewComments(node(1));
    expect(c.countNewComments).toHaveBeenCalledWith(
      expect.objectContaining({ entityTypeId: 'node', entityId: 1, after: recent }),
    );
  });

  it('clamps the count-from time to the 30-day read limit', () => {
    const ancient = REQUEST_TIME - 365 * 24 * 60 * 60; // older than 30 days
    const { m, c } = manager({ rows: [{ uid: 7, nid: 1, timestamp: ancient }] });
    m.getCountNewComments(node(1));
    const arg = (c.countNewComments as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.after).toBe(REQUEST_TIME - 30 * 24 * 60 * 60);
  });

  it('passes through an explicit field name', () => {
    const { m, c } = manager({});
    m.getCountNewComments(node(1), 'comment');
    expect(c.countNewComments).toHaveBeenCalledWith(
      expect.objectContaining({ fieldName: 'comment' }),
    );
  });
});
