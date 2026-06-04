import { describe, it, expect } from 'vitest';
import { InMemoryWatchdogStore } from './watchdog-store.js';
import { RfcLogLevel, type WatchdogInsert } from './types.js';

function row(overrides: Partial<WatchdogInsert> = {}): WatchdogInsert {
  return {
    uid: 0,
    type: 'system',
    message: 'hello',
    variables: 'a:0:{}',
    severity: RfcLogLevel.NOTICE,
    link: null,
    location: 'http://localhost/',
    referer: null,
    hostname: '127.0.0.1',
    timestamp: 1000,
    ...overrides,
  };
}

describe('InMemoryWatchdogStore', () => {
  it('assigns ascending wids starting at 1 and loads inserted rows', () => {
    const store = new InMemoryWatchdogStore();
    const wid1 = store.insert(row());
    const wid2 = store.insert(row({ message: 'second' }));
    expect(wid1).toBe(1);
    expect(wid2).toBe(2);
    expect(store.load(wid2)?.message).toBe('second');
    expect(store.load(999)).toBeUndefined();
  });

  it('reports count and distinct types in ascending order', () => {
    const store = new InMemoryWatchdogStore();
    store.insert(row({ type: 'user' }));
    store.insert(row({ type: 'access' }));
    store.insert(row({ type: 'user' }));
    expect(store.count()).toBe(3);
    expect(store.distinctTypes()).toEqual(['access', 'user']);
  });

  it('prunes to keep only the most recent N rows by descending wid', () => {
    const store = new InMemoryWatchdogStore();
    for (let i = 0; i < 5; i++) store.insert(row({ message: `m${i}` }));
    store.pruneToRowLimit(2);
    expect(store.count()).toBe(2);
    // Keeps the two most recent (wid 4 and 5).
    expect(store.all().map((r) => r.wid).sort((a, b) => a - b)).toEqual([4, 5]);
  });

  it('treats a row limit of 0 as keep-all (no-op)', () => {
    const store = new InMemoryWatchdogStore();
    store.insert(row());
    store.insert(row());
    store.pruneToRowLimit(0);
    expect(store.count()).toBe(2);
  });

  it('clear() removes all rows', () => {
    const store = new InMemoryWatchdogStore();
    store.insert(row());
    store.clear();
    expect(store.count()).toBe(0);
  });
});
