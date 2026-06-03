import { describe, it, expect, vi } from 'vitest';
import {
  HistoryController,
  AccessDeniedHttpException,
  NotFoundHttpException,
} from './history-controller.js';
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

const authed: HistoryAccount = { id: () => 7, isAuthenticated: () => true };
const anon: HistoryAccount = { id: () => null, isAuthenticated: () => false };

describe('HistoryController.getNodeReadTimestamps', () => {
  it('throws AccessDenied for anonymous users', () => {
    const repo = new HistoryRepository(makeStorage(), anon, time);
    const c = new HistoryController(repo, anon);
    expect(() => c.getNodeReadTimestamps([1])).toThrow(AccessDeniedHttpException);
  });

  it('throws NotFound when node ids are missing', () => {
    const repo = new HistoryRepository(makeStorage(), authed, time);
    const c = new HistoryController(repo, authed);
    expect(() => c.getNodeReadTimestamps(undefined)).toThrow(NotFoundHttpException);
  });

  it('returns timestamps keyed by nid', () => {
    const repo = new HistoryRepository(makeStorage([{ uid: 7, nid: 1, timestamp: 99 }]), authed, time);
    const c = new HistoryController(repo, authed);
    expect(c.getNodeReadTimestamps([1, 2])).toEqual({ 1: 99, 2: 0 });
  });
});

describe('HistoryController.readNode', () => {
  it('throws AccessDenied for anonymous users', () => {
    const repo = new HistoryRepository(makeStorage(), anon, time);
    const c = new HistoryController(repo, anon);
    expect(() => c.readNode(1)).toThrow(AccessDeniedHttpException);
  });

  it('writes the read and returns the new timestamp', () => {
    const storage = makeStorage();
    const repo = new HistoryRepository(storage, authed, time);
    const c = new HistoryController(repo, authed);
    expect(c.readNode(42)).toBe(REQUEST_TIME);
    expect(storage.writeTimestamp).toHaveBeenCalledWith(7, 42, REQUEST_TIME);
  });
});
