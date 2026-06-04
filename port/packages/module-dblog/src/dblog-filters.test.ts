import { describe, it, expect } from 'vitest';
import { DbLogFilters } from './dblog-filters.js';
import { InMemoryWatchdogStore } from './watchdog-store.js';
import { RfcLogLevel, type WatchdogInsert } from './types.js';

function row(type: string): WatchdogInsert {
  return {
    uid: 0,
    type,
    message: 'm',
    variables: 'null',
    severity: RfcLogLevel.NOTICE,
    link: null,
    location: '/',
    referer: null,
    hostname: '127.0.0.1',
    timestamp: 1,
  };
}

describe('DbLogFilters', () => {
  it('getMessageTypes returns distinct types ascending', () => {
    const store = new InMemoryWatchdogStore();
    store.insert(row('user'));
    store.insert(row('cron'));
    store.insert(row('user'));
    const filters = new DbLogFilters(store);
    expect(filters.getMessageTypes()).toEqual(['cron', 'user']);
  });

  it('filters() includes a type filter only when types exist', () => {
    const empty = new DbLogFilters(new InMemoryWatchdogStore());
    expect(empty.filters().type).toBeUndefined();

    const store = new InMemoryWatchdogStore();
    store.insert(row('user'));
    const filters = new DbLogFilters(store);
    const f = filters.filters();
    expect(f.type?.field).toBe('w.type');
    expect(f.type?.options).toEqual({ user: 'user' });
  });

  it('filters() always includes a severity filter with all RFC levels', () => {
    const filters = new DbLogFilters(new InMemoryWatchdogStore());
    const severity = filters.filters().severity!;
    expect(severity.field).toBe('w.severity');
    expect(severity.options[RfcLogLevel.EMERGENCY]).toBe('Emergency');
    expect(Object.keys(severity.options)).toHaveLength(8);
  });
});
