import { describe, it, expect, vi } from 'vitest';
import {
  LoggerChannel,
  LoggerChannelFactory,
  NullLogger,
  MemoryLogger,
  interpolateMessage,
  LOG_LEVELS,
  LOG_LEVEL_SEVERITY,
  type LoggerInterface,
} from './index.js';

describe('LoggerChannel', () => {
  it('fans out log calls to added loggers', () => {
    const channel = new LoggerChannel('default');
    const loggerA: LoggerInterface = { log: vi.fn(), emergency: vi.fn(), alert: vi.fn(), critical: vi.fn(), error: vi.fn(), warning: vi.fn(), notice: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const loggerB: LoggerInterface = { log: vi.fn(), emergency: vi.fn(), alert: vi.fn(), critical: vi.fn(), error: vi.fn(), warning: vi.fn(), notice: vi.fn(), info: vi.fn(), debug: vi.fn() };
    channel.addLogger(loggerA);
    channel.addLogger(loggerB);
    channel.error('test error');
    expect(loggerA.log).toHaveBeenCalledWith('error', 'test error', expect.objectContaining({ channel: 'default' }));
    expect(loggerB.log).toHaveBeenCalledWith('error', 'test error', expect.objectContaining({ channel: 'default' }));
  });

  it('calls all convenience methods', () => {
    const memory = new MemoryLogger();
    const channel = new LoggerChannel('test');
    channel.addLogger(memory);
    channel.emergency('e'); channel.alert('a'); channel.critical('c');
    channel.error('er'); channel.warning('w'); channel.notice('n');
    channel.info('i'); channel.debug('d');
    const levels = memory.records.map(r => r.level);
    expect(levels).toEqual(['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug']);
  });

  it('orders loggers by descending priority', () => {
    const order: string[] = [];
    const makeLogger = (name: string): LoggerInterface => ({
      log: () => { order.push(name); },
      emergency: vi.fn(), alert: vi.fn(), critical: vi.fn(), error: vi.fn(), warning: vi.fn(), notice: vi.fn(), info: vi.fn(), debug: vi.fn(),
    });
    const channel = new LoggerChannel('order');
    channel.addLogger(makeLogger('low'), 1);
    channel.addLogger(makeLogger('high'), 10);
    channel.addLogger(makeLogger('mid'), 5);
    channel.info('test');
    expect(order).toEqual(['high', 'mid', 'low']);
  });

  it('getChannel() returns channel name', () => {
    expect(new LoggerChannel('mymodule').getChannel()).toBe('mymodule');
  });
});

describe('LoggerChannelFactory', () => {
  it('get() returns same instance for same channel name', () => {
    const factory = new LoggerChannelFactory();
    expect(factory.get('default')).toBe(factory.get('default'));
  });

  it('addLogger() propagates to existing and future channels', () => {
    const factory = new LoggerChannelFactory();
    const memory = new MemoryLogger();
    const existing = factory.get('existing');
    factory.addLogger(memory);
    const future = factory.get('future');
    existing.info('existing message');
    future.info('future message');
    expect(memory.records).toHaveLength(2);
  });
});

describe('MemoryLogger', () => {
  it('captures records', () => {
    const logger = new MemoryLogger();
    logger.error('oops', { code: 500 });
    expect(logger.records).toHaveLength(1);
    expect(logger.records[0]?.level).toBe('error');
    expect(logger.records[0]?.message).toBe('oops');
  });

  it('clear() empties records', () => {
    const logger = new MemoryLogger();
    logger.info('x');
    logger.clear();
    expect(logger.records).toHaveLength(0);
  });

  it('getByLevel() filters records', () => {
    const logger = new MemoryLogger();
    logger.error('e1'); logger.info('i1'); logger.error('e2');
    expect(logger.getByLevel('error')).toHaveLength(2);
    expect(logger.getByLevel('info')).toHaveLength(1);
  });
});

describe('NullLogger', () => {
  it('silently discards all log calls', () => {
    const logger = new NullLogger();
    expect(() => logger.log('error', 'x')).not.toThrow();
    expect(() => logger.emergency('x')).not.toThrow();
  });
});

describe('interpolateMessage', () => {
  it('replaces {key} placeholders', () => {
    const result = interpolateMessage('User {username} logged in', { username: 'alice' });
    expect(result).toBe('User alice logged in');
  });

  it('leaves unknown placeholders unchanged', () => {
    const result = interpolateMessage('Hello {name}', {});
    expect(result).toBe('Hello {name}');
  });

  it('converts non-string context values to string', () => {
    const result = interpolateMessage('Count: {n}', { n: 42 });
    expect(result).toBe('Count: 42');
  });
});

describe('LOG_LEVELS and LOG_LEVEL_SEVERITY', () => {
  it('lists all 8 PSR-3 levels', () => {
    expect(LOG_LEVELS).toHaveLength(8);
    expect(LOG_LEVELS).toContain('emergency');
    expect(LOG_LEVELS).toContain('debug');
  });

  it('emergency has lowest severity number (most severe)', () => {
    expect(LOG_LEVEL_SEVERITY.emergency).toBe(0);
    expect(LOG_LEVEL_SEVERITY.debug).toBe(7);
  });
});
