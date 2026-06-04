import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HistoryRepository,
  THIRTY_DAYS_SECONDS,
  type HistoryStorage,
  type HistoryAccount,
  type TimeService,
  type HistoryRow,
} from './history-repository.js';

const REQUEST_TIME = 1_700_000_000;

function makeStorage(rows: HistoryRow[] = []): HistoryStorage {
  return {
    readTimestamps: vi.fn((uid: number, nids: readonly number[]) =>
      rows.filter((r) => r.uid === uid && nids.includes(r.nid)),
    ),
    writeTimestamp: vi.fn(),
    deleteOlderThan: vi.fn(),
    deleteByNid: vi.fn(),
    deleteByUid: vi.fn(),
  };
}

function makeAccount(id: number | null, authenticated: boolean): HistoryAccount {
  return { id: () => id, isAuthenticated: () => authenticated };
}

const time: TimeService = { getRequestTime: () => REQUEST_TIME };

describe('HistoryRepository.readLimit', () => {
  it('is 30 days before request time', () => {
    const repo = new HistoryRepository(makeStorage(), makeAccount(1, true), time);
    expect(repo.readLimit()).toBe(REQUEST_TIME - THIRTY_DAYS_SECONDS);
  });
});

describe('HistoryRepository.read / readMultiple', () => {
  it('returns 0 for nodes the user never viewed', () => {
    const repo = new HistoryRepository(makeStorage(), makeAccount(7, true), time);
    expect(repo.read(42)).toBe(0);
  });

  it('returns the stored timestamp for a viewed node', () => {
    const storage = makeStorage([{ uid: 7, nid: 42, timestamp: 12345 }]);
    const repo = new HistoryRepository(storage, makeAccount(7, true), time);
    expect(repo.read(42)).toBe(12345);
  });

  it('keys results by nid, defaulting unseen nids to 0', () => {
    const storage = makeStorage([{ uid: 7, nid: 1, timestamp: 100 }]);
    const repo = new HistoryRepository(storage, makeAccount(7, true), time);
    expect(repo.readMultiple([1, 2])).toEqual({ 1: 100, 2: 0 });
  });

  it('caches per request and does not re-query resolved nids', () => {
    const storage = makeStorage([{ uid: 7, nid: 1, timestamp: 100 }]);
    const repo = new HistoryRepository(storage, makeAccount(7, true), time);
    repo.readMultiple([1, 2]);
    repo.readMultiple([1, 2]);
    // Second call is fully cached -> no further storage read.
    expect(storage.readTimestamps).toHaveBeenCalledTimes(1);
  });

  it('uses uid 0 for anonymous reads', () => {
    const storage = makeStorage();
    const repo = new HistoryRepository(storage, makeAccount(null, false), time);
    repo.readMultiple([5]);
    expect(storage.readTimestamps).toHaveBeenCalledWith(0, [5]);
  });
});

describe('HistoryRepository.write', () => {
  it('upserts and updates the static cache for authenticated users', () => {
    const storage = makeStorage();
    const repo = new HistoryRepository(storage, makeAccount(7, true), time);
    repo.write(42);
    expect(storage.writeTimestamp).toHaveBeenCalledWith(7, 42, REQUEST_TIME);
    // Now cached: read() should not hit storage.
    (storage.readTimestamps as ReturnType<typeof vi.fn>).mockClear();
    expect(repo.read(42)).toBe(REQUEST_TIME);
    expect(storage.readTimestamps).not.toHaveBeenCalled();
  });

  it('is a no-op for anonymous users', () => {
    const storage = makeStorage();
    const repo = new HistoryRepository(storage, makeAccount(null, false), time);
    repo.write(42);
    expect(storage.writeTimestamp).not.toHaveBeenCalled();
  });

  it('honors an explicitly passed account', () => {
    const storage = makeStorage();
    const repo = new HistoryRepository(storage, makeAccount(7, true), time);
    repo.write(42, makeAccount(9, true));
    expect(storage.writeTimestamp).toHaveBeenCalledWith(9, 42, REQUEST_TIME);
  });
});

describe('HistoryRepository.resetCache', () => {
  let storage: HistoryStorage;
  let repo: HistoryRepository;
  beforeEach(() => {
    storage = makeStorage([{ uid: 7, nid: 1, timestamp: 100 }]);
    repo = new HistoryRepository(storage, makeAccount(7, true), time);
  });

  it('forces a re-query after reset', () => {
    repo.read(1);
    repo.resetCache();
    repo.read(1);
    expect(storage.readTimestamps).toHaveBeenCalledTimes(2);
  });
});
