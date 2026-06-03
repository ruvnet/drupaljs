import { describe, it, expect, vi } from 'vitest';
import { SysLog } from './syslog.js';
import { RfcLogLevel } from '../types.js';
import type {
  ConfigFactoryInterface,
  ConfigInterface,
  LogMessageParserInterface,
  SyslogContext,
} from '../types.js';

/** Build a config factory whose `syslog.settings` returns the given values. */
function makeConfigFactory(values: Record<string, unknown>): {
  factory: ConfigFactoryInterface;
  get: ReturnType<typeof vi.fn>;
} {
  const get = vi.fn((key: string) => values[key]);
  const config: ConfigInterface = { get };
  const factory: ConfigFactoryInterface = {
    get: vi.fn((name: string) => {
      expect(name).toBe('syslog.settings');
      return config;
    }),
  };
  return { factory, get };
}

/** A parser test double mirroring LogMessageParserInterface. */
function makeParser(
  result: Record<string, string> = {},
): { parser: LogMessageParserInterface; spy: ReturnType<typeof vi.fn> } {
  const spy = vi.fn(() => result);
  return { parser: { parseMessagePlaceholders: spy }, spy };
}

const baseContext: SyslogContext = {
  channel: 'php',
  timestamp: 1700000000,
  ip: '127.0.0.1',
  request_uri: '/node/1',
  referer: 'https://example.com',
  uid: 7,
  link: '<a href="/x">x</a>',
};

describe('SysLog', () => {
  it('writes a formatted entry via the syslog sink when format is configured', () => {
    const { factory } = makeConfigFactory({
      identity: 'drupal',
      facility: 8,
      format: '!type|!severity|!uid|!message',
    });
    const { parser } = makeParser({});
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { baseUrl: 'https://site', sink });

    logger.log(RfcLogLevel.NOTICE, 'Hello', baseContext);

    expect(sink).toHaveBeenCalledTimes(1);
    const [level, entry] = sink.mock.calls[0]!;
    expect(level).toBe(RfcLogLevel.NOTICE);
    expect(entry).toBe('php|5|7|Hello');
  });

  it('returns early and never opens a connection when format is empty', () => {
    const { factory } = makeConfigFactory({ identity: 'drupal', facility: 8, format: '' });
    const { parser, spy } = makeParser();
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { sink });

    logger.log(RfcLogLevel.ERROR, 'ignored', baseContext);

    expect(sink).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not write when identity or facility are not configured (connection cannot open)', () => {
    const { factory } = makeConfigFactory({
      identity: null,
      facility: null,
      format: '!message',
    });
    const { parser } = makeParser();
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { sink });

    logger.log(RfcLogLevel.WARNING, 'msg', baseContext);

    expect(sink).not.toHaveBeenCalled();
  });

  it('substitutes message placeholders before stripping tags', () => {
    const { factory } = makeConfigFactory({ identity: 'd', facility: 8, format: '!message' });
    const { parser, spy } = makeParser({ '@name': '<b>Bob</b>' });
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { sink });

    logger.log(RfcLogLevel.INFO, 'Hi @name', { ...baseContext, '@name': '<b>Bob</b>' });

    expect(spy).toHaveBeenCalledWith('Hi @name', expect.any(Object));
    // Placeholders substituted, then strip_tags removes the <b> markup.
    expect(sink.mock.calls[0]![1]).toBe('Hi Bob');
  });

  it('expands every documented token including !base_url and strips tags from !link', () => {
    const { factory } = makeConfigFactory({
      identity: 'd',
      facility: 8,
      format: '!base_url|!timestamp|!type|!ip|!request_uri|!referer|!severity|!uid|!link|!message',
    });
    const { parser } = makeParser();
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { baseUrl: 'https://site', sink });

    logger.log(RfcLogLevel.DEBUG, 'plain', baseContext);

    expect(sink.mock.calls[0]![1]).toBe(
      'https://site|1700000000|php|127.0.0.1|/node/1|https://example.com|7|7|x|plain',
    );
  });

  it('opens the connection only once across multiple log calls', () => {
    const { factory } = makeConfigFactory({ identity: 'd', facility: 8, format: '!message' });
    const { parser } = makeParser();
    const openConnection = vi.fn(() => true);
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { sink, openConnection });

    logger.log(RfcLogLevel.INFO, 'a', baseContext);
    logger.log(RfcLogLevel.INFO, 'b', baseContext);

    expect(openConnection).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('does not write when openConnection fails to connect', () => {
    const { factory } = makeConfigFactory({ identity: 'd', facility: 8, format: '!message' });
    const { parser } = makeParser();
    const sink = vi.fn();
    const logger = new SysLog(factory, parser, { sink, openConnection: () => false });

    logger.log(RfcLogLevel.INFO, 'a', baseContext);

    expect(sink).not.toHaveBeenCalled();
  });
});
