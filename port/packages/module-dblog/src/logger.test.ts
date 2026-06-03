import { describe, it, expect, vi } from 'vitest';
import { DbLog } from './logger.js';
import { InMemoryWatchdogStore } from './watchdog-store.js';
import { RfcLogLevel, type LogContext, type WatchdogStore } from './types.js';

function ctx(overrides: Partial<LogContext> = {}): LogContext {
  return {
    channel: 'mymodule',
    uid: 7,
    link: '/node/1',
    request_uri: 'http://localhost/admin',
    referer: 'http://localhost/',
    ip: '10.0.0.1',
    timestamp: 1234,
    ...overrides,
  };
}

describe('DbLog logger', () => {
  it('writes a watchdog row with mapped fields', () => {
    const store = new InMemoryWatchdogStore();
    const log = new DbLog(store);
    log.log(RfcLogLevel.WARNING, 'User @name created', ctx({ '@name': 'alice' }));

    const entries = store.all();
    expect(entries).toHaveLength(1);
    const e = entries[0]!;
    expect(e.type).toBe('mymodule');
    expect(e.message).toBe('User @name created');
    expect(e.severity).toBe(RfcLogLevel.WARNING);
    expect(e.uid).toBe(7);
    expect(e.location).toBe('http://localhost/admin');
    expect(e.hostname).toBe('10.0.0.1');
    expect(e.timestamp).toBe(1234);
  });

  it('serializes only the message placeholders (@/%/: prefixed) into variables', () => {
    const store = new InMemoryWatchdogStore();
    const log = new DbLog(store);
    log.log(RfcLogLevel.INFO, 'a @x b %y', ctx({ '@x': 1, '%y': 2, channel: 'c' }));
    const stored = JSON.parse(store.all()[0]!.variables);
    expect(stored).toEqual({ '@x': 1, '%y': 2 });
  });

  it('strips backtrace and exception from context before storing', () => {
    const store = new InMemoryWatchdogStore();
    const log = new DbLog(store);
    log.log(RfcLogLevel.ERROR, 'boom @z', ctx({ '@z': 'q', backtrace: ['x'], exception: new Error('e') }));
    const stored = JSON.parse(store.all()[0]!.variables);
    expect(stored).toEqual({ '@z': 'q' });
  });

  it('truncates channel/type to 64 and hostname to 128 chars', () => {
    const store = new InMemoryWatchdogStore();
    const log = new DbLog(store);
    log.log(RfcLogLevel.NOTICE, 'm', ctx({ channel: 'c'.repeat(100), ip: 'h'.repeat(200) }));
    const e = store.all()[0]!;
    expect(e.type).toHaveLength(64);
    expect(e.hostname).toHaveLength(128);
  });

  it('convenience level methods delegate to log() with the right severity', () => {
    const store = new InMemoryWatchdogStore();
    const log = new DbLog(store);
    log.emergency('e', ctx());
    log.debug('d', ctx());
    expect(store.all().map((r) => r.severity)).toEqual([RfcLogLevel.EMERGENCY, RfcLogLevel.DEBUG]);
  });

  it('retries once on a transient insert failure using a dedicated store', () => {
    const failing: WatchdogStore = {
      insert: vi.fn().mockImplementationOnce(() => {
        throw new Error('2006 MySQL server has gone away');
      }).mockReturnValue(1),
      load: vi.fn(),
      all: vi.fn().mockReturnValue([]),
      distinctTypes: vi.fn().mockReturnValue([]),
      count: vi.fn().mockReturnValue(0),
      pruneToRowLimit: vi.fn(),
      clear: vi.fn(),
    };
    const dedicated = new InMemoryWatchdogStore();
    const log = new DbLog(failing, () => dedicated);
    log.log(RfcLogLevel.CRITICAL, 'survive', ctx());
    // First (failing) store attempted once; dedicated store received the row.
    expect(failing.insert).toHaveBeenCalledTimes(1);
    expect(dedicated.count()).toBe(1);
  });

  it('rethrows when there is no dedicated-connection factory', () => {
    const failing: WatchdogStore = {
      insert: () => {
        throw new Error('fatal');
      },
      load: () => undefined,
      all: () => [],
      distinctTypes: () => [],
      count: () => 0,
      pruneToRowLimit: () => {},
      clear: () => {},
    };
    const log = new DbLog(failing);
    expect(() => log.log(RfcLogLevel.ALERT, 'x', ctx())).toThrow('fatal');
  });
});
