import { describe, it, expect, vi } from 'vitest';

import { BigPipeStrategy, NOJS_COOKIE } from './big-pipe-strategy.js';
import type {
  RequestLike,
  RequestStackLike,
  RouteMatchLike,
  SessionConfigurationLike,
  PlaceholderMap,
} from './types.js';

/** Builds a mock request with controllable cookie/method state. */
function mockRequest(opts: {
  cacheable?: boolean;
  nojsCookie?: boolean;
}): RequestLike {
  const cookies = new Set<string>();
  if (opts.nojsCookie) cookies.add(NOJS_COOKIE);
  return {
    cookies: { has: (name) => cookies.has(name) },
    query: { has: () => false, get: () => null },
    isMethodCacheable: () => opts.cacheable ?? true,
  };
}

/** Wires up a strategy with prophesized collaborators. */
function makeStrategy(opts: {
  request: RequestLike | null;
  parent?: RequestLike | null;
  hasSession?: boolean;
  noBigPipeOption?: unknown;
}) {
  const requestStack: RequestStackLike = {
    getCurrentRequest: vi.fn(() => opts.request),
    getParentRequest: vi.fn(() => opts.parent ?? null),
  };
  const sessionConfiguration: SessionConfigurationLike = {
    hasSession: vi.fn(() => opts.hasSession ?? true),
  };
  const routeMatch: RouteMatchLike = {
    getRouteObject: vi.fn(() => ({
      getOption: vi.fn((name: string) =>
        name === '_no_big_pipe' ? opts.noBigPipeOption ?? null : null,
      ),
      setOption: vi.fn(),
    })),
  };
  return {
    strategy: new BigPipeStrategy(sessionConfiguration, requestStack, routeMatch),
    sessionConfiguration,
    routeMatch,
  };
}

/** A simple HTML placeholder using a lazy builder. */
const htmlPlaceholders: PlaceholderMap = {
  '<drupal-render-placeholder callback="my_callback" arguments="" token="abc"></drupal-render-placeholder>':
    { '#lazy_builder': ['my_callback', []] },
};

describe('BigPipeStrategy gating (processPlaceholders)', () => {
  it('returns nothing for a sub-request', () => {
    const req = mockRequest({});
    const { strategy } = makeStrategy({ request: req, parent: req });
    expect(strategy.processPlaceholders(htmlPlaceholders)).toEqual({});
  });

  it('returns nothing for uncacheable request methods (POST)', () => {
    const { strategy } = makeStrategy({
      request: mockRequest({ cacheable: false }),
    });
    expect(strategy.processPlaceholders(htmlPlaceholders)).toEqual({});
  });

  it('returns nothing when the route opts out via _no_big_pipe', () => {
    const { strategy } = makeStrategy({
      request: mockRequest({}),
      noBigPipeOption: true,
    });
    expect(strategy.processPlaceholders(htmlPlaceholders)).toEqual({});
  });

  it('returns nothing when there is no session', () => {
    const { strategy } = makeStrategy({
      request: mockRequest({}),
      hasSession: false,
    });
    expect(strategy.processPlaceholders(htmlPlaceholders)).toEqual({});
  });

  it('processes placeholders when all gates pass', () => {
    const { strategy } = makeStrategy({ request: mockRequest({}) });
    const result = strategy.processPlaceholders(htmlPlaceholders);
    expect(Object.keys(result)).toHaveLength(1);
  });
});

describe('BigPipeStrategy transformation', () => {
  it('creates a JS placeholder (span with data-big-pipe-placeholder-id) for HTML placeholders', () => {
    const { strategy } = makeStrategy({ request: mockRequest({}) });
    const key = Object.keys(htmlPlaceholders)[0]!;
    const out = strategy.processPlaceholders(htmlPlaceholders)[key]!;

    expect(String(out['#prefix'])).toContain('data-big-pipe-placeholder-id="');
    expect(out['#suffix']).toBe('</span>');
    const cache = out['#cache'] as { 'max-age': number; contexts: string[] };
    expect(cache['max-age']).toBe(0);
    expect(cache.contexts).toContain('session.exists');
    const attached = out['#attached'] as Record<string, any>;
    expect(attached.library).toContain('big_pipe/big_pipe');
    expect(attached.big_pipe_placeholders).toBeDefined();
  });

  it('falls back to a no-JS placeholder when the no-JS cookie is present', () => {
    const { strategy } = makeStrategy({
      request: mockRequest({ nojsCookie: true }),
    });
    const key = Object.keys(htmlPlaceholders)[0]!;
    const out = strategy.processPlaceholders(htmlPlaceholders)[key]!;

    expect(String(out['#markup'])).toContain('data-big-pipe-nojs-placeholder-id="');
    const attached = out['#attached'] as Record<string, any>;
    expect(attached.big_pipe_nojs_placeholders).toBeDefined();
    const cache = out['#cache'] as { contexts: string[] };
    expect(cache.contexts).toContain(`cookies:${NOJS_COOKIE}`);
  });

  it('uses an attribute-safe no-JS placeholder for non-HTML placeholders', () => {
    const attrPlaceholder: PlaceholderMap = {
      'form_action_p_pvdeGsVG5zNF_XLGPTvYSKCf43t8qZYSwBX-n4jERA':
        { '#lazy_builder': ['form_action', []] },
    };
    const { strategy } = makeStrategy({ request: mockRequest({}) });
    const key = Object.keys(attrPlaceholder)[0]!;
    const out = strategy.processPlaceholders(attrPlaceholder)[key]!;

    expect(String(out['#markup'])).toContain(
      'big_pipe_nojs_placeholder_attribute_safe:',
    );
  });
});
