/**
 * London-school tests for page_cache hook implementations (Red first).
 */
import { describe, it, expect, vi } from 'vitest';
import { pageCacheHelp, registerPageCacheHooks } from './hooks.js';

describe('pageCacheHelp', () => {
  it('returns help markup for the page_cache help route', () => {
    const out = pageCacheHelp('help.page.page_cache');
    expect(out).toContain('Internal Page Cache module');
    expect(out).toContain('<h2>');
  });

  it('returns null for any other route', () => {
    expect(pageCacheHelp('some.other.route')).toBeNull();
  });
});

describe('registerPageCacheHooks', () => {
  it('registers the help hook on the module handler under "page_cache"', () => {
    const handler = { implement: vi.fn() };
    registerPageCacheHooks(handler as never);

    expect(handler.implement).toHaveBeenCalledWith(
      'page_cache',
      'help',
      expect.any(Function),
    );
  });

  it('the registered help callback forwards the route name to pageCacheHelp', () => {
    let registered: ((...args: unknown[]) => unknown) | undefined;
    const handler = {
      implement: vi.fn((_m: string, _h: string, cb: (...a: unknown[]) => unknown) => {
        registered = cb;
      }),
    };
    registerPageCacheHooks(handler as never);

    expect(registered?.('help.page.page_cache')).toContain('Internal Page Cache module');
    expect(registered?.('nope')).toBeNull();
  });
});
