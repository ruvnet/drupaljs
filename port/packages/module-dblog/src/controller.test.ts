import { describe, it, expect } from 'vitest';
import { formatMessage } from './controller.js';
import type { WatchdogEntry } from './types.js';
import { RfcLogLevel } from './types.js';

function entry(overrides: Partial<WatchdogEntry> = {}): WatchdogEntry {
  return {
    wid: 1,
    uid: 0,
    type: 'system',
    message: 'Hello world',
    variables: JSON.stringify({}),
    severity: RfcLogLevel.NOTICE,
    link: null,
    location: '/',
    referer: null,
    hostname: '127.0.0.1',
    timestamp: 1,
    ...overrides,
  };
}

describe('formatMessage (DbLogController port)', () => {
  it('returns the admin-filtered message when there are no variables', () => {
    const out = formatMessage(entry({ message: 'plain <b>text</b>', variables: 'null' }));
    // <b> is allowed by Xss::filterAdmin; <script> would be stripped.
    expect(out).toContain('plain');
  });

  it('substitutes @ placeholders into the message', () => {
    const out = formatMessage(
      entry({ message: 'User @name logged in', variables: JSON.stringify({ '@name': 'alice' }) }),
    );
    expect(out).toBe('User alice logged in');
  });

  it('substitutes % placeholders into the message', () => {
    const out = formatMessage(
      entry({ message: 'Deleted %title', variables: JSON.stringify({ '%title': 'Page' }) }),
    );
    expect(out).toBe('Deleted Page');
  });

  it('returns a corruption notice when variables cannot be parsed as an array/object', () => {
    const out = formatMessage(entry({ message: 'oops', variables: '"a plain string"' }));
    expect(out).toContain('cannot be unserialized');
  });

  it('returns false when message or variables are missing', () => {
    // @ts-expect-error intentionally omitting required fields for the guard test
    expect(formatMessage({ wid: 1 })).toBe(false);
  });
});
