import { describe, it, expect, vi } from 'vitest';
import {
  DynamicPageCacheSubscriber,
  DYNAMIC_CACHE_HEADER,
  type VariationCacheInterface,
  type CacheContextsManagerInterface,
  type CacheableMetadata,
  type CacheableResponse,
  type RequestEvent,
} from './subscriber.js';
import {
  RequestPolicy,
  ResponsePolicy,
  type PageRequest,
  type RequestPolicyInterface,
  type ResponsePolicyInterface,
} from './page-cache-policy.js';

const PERMANENT = -1;

const makeRequest = (overrides: Partial<PageRequest> = {}): PageRequest => ({
  method: 'GET',
  isCli: false,
  ...overrides,
});

const makeResponse = (
  meta: Partial<{ maxAge: number; contexts: string[]; tags: string[] }> = {},
): CacheableResponse => ({
  headers: new Map<string, string>(),
  statusCode: 200,
  cacheableMetadata: {
    maxAge: meta.maxAge ?? PERMANENT,
    contexts: meta.contexts ?? [],
    tags: meta.tags ?? [],
  },
});

const allowPolicy: RequestPolicyInterface = { check: () => RequestPolicy.ALLOW };
const denyPolicy: RequestPolicyInterface = { check: () => RequestPolicy.DENY };
const nullResponsePolicy: ResponsePolicyInterface = { check: () => null };
const denyResponsePolicy: ResponsePolicyInterface = { check: () => ResponsePolicy.DENY };

const identityContextsManager: CacheContextsManagerInterface = {
  optimizeTokens: (c) => c,
  convertTokensToKeys: () => ({ tags: [] }),
};

const rendererConfig = {
  auto_placeholder_conditions: {
    'max-age': 0,
    contexts: ['session', 'user'],
    tags: [],
  },
};

function makeCache(): VariationCacheInterface & {
  store: Map<string, CacheableResponse>;
} {
  const store = new Map<string, CacheableResponse>();
  const get = vi.fn(
    (_keys: string[], _meta: Partial<CacheableMetadata>): { data: CacheableResponse } | null => {
      const cached = store.get('response');
      return cached ? { data: cached } : null;
    },
  );
  const set = vi.fn(
    (
      _keys: string[],
      data: CacheableResponse,
      _metadata: CacheableMetadata,
      _initialMetadata: Partial<CacheableMetadata>,
    ): void => {
      store.set('response', data);
    },
  );
  return { store, get, set };
}

/** Builds a REQUEST event, satisfying exactOptionalPropertyTypes. */
function makeRequestEvent(request: PageRequest): RequestEvent {
  return { request };
}

function makeSubscriber(
  opts: {
    requestPolicy?: RequestPolicyInterface;
    responsePolicy?: ResponsePolicyInterface;
    cache?: VariationCacheInterface;
  } = {},
) {
  const cache = opts.cache ?? makeCache();
  const subscriber = new DynamicPageCacheSubscriber(
    opts.requestPolicy ?? allowPolicy,
    opts.responsePolicy ?? nullResponsePolicy,
    cache,
    identityContextsManager,
    rendererConfig,
  );
  return { subscriber, cache };
}

describe('DynamicPageCacheSubscriber.getSubscribedEvents', () => {
  it('subscribes to REQUEST and RESPONSE with the Drupal priorities (27 / 7)', () => {
    const events = DynamicPageCacheSubscriber.getSubscribedEvents();
    expect(events.request).toEqual([{ method: 'onRequest', priority: 27 }]);
    expect(events.response).toEqual([{ method: 'onResponse', priority: 7 }]);
  });
});

describe('DynamicPageCacheSubscriber.onRequest', () => {
  it('does nothing when the request policy denies', () => {
    const { subscriber } = makeSubscriber({ requestPolicy: denyPolicy });
    const event = makeRequestEvent(makeRequest());
    subscriber.onRequest(event);
    expect(event.response).toBeUndefined();
  });

  it('serves a cached response (HIT) on a cache hit', () => {
    const { subscriber, cache } = makeSubscriber();
    const cached = makeResponse({ maxAge: PERMANENT, contexts: ['route'] });
    cache.set(['response'], cached, { maxAge: PERMANENT, contexts: ['route'], tags: [] }, {});
    const event = makeRequestEvent(makeRequest());
    subscriber.onRequest(event);
    expect(event.response).toBe(cached);
    expect(event.response?.headers.get(DYNAMIC_CACHE_HEADER)).toBe('HIT');
  });

  it('leaves the response unset on a cache miss but records the policy result', () => {
    const { subscriber } = makeSubscriber();
    const event = makeRequestEvent(makeRequest());
    subscriber.onRequest(event);
    expect(event.response).toBeUndefined();
  });
});

describe('DynamicPageCacheSubscriber.onResponse', () => {
  it('caches a cacheable response on a miss and marks it MISS', () => {
    const { subscriber, cache } = makeSubscriber();
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse({ maxAge: PERMANENT, contexts: ['route'] });
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toBe('MISS');
    expect(cache.set).toHaveBeenCalled();
  });

  it('marks responses to uncacheable methods without polluting the header', () => {
    const { subscriber } = makeSubscriber();
    const request = makeRequest({ method: 'POST' });
    const response = makeResponse();
    subscriber.onResponse({ request, response });
    expect(response.headers.has(DYNAMIC_CACHE_HEADER)).toBe(false);
  });

  it('marks UNCACHEABLE when the request subscriber did not fire', () => {
    const { subscriber, cache } = makeSubscriber();
    const request = makeRequest();
    // No onRequest() call -> no recorded policy result.
    const response = makeResponse();
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toContain('UNCACHEABLE (200');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('does no work when the response is already a HIT', () => {
    const { subscriber, cache } = makeSubscriber();
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse();
    response.headers.set(DYNAMIC_CACHE_HEADER, 'HIT');
    subscriber.onResponse({ request, response });
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('refuses to cache poorly-cacheable responses (low max-age)', () => {
    const { subscriber, cache } = makeSubscriber();
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse({ maxAge: 0 });
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toBe('UNCACHEABLE (poor cacheability)');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('refuses to cache responses with a high-cardinality context', () => {
    const { subscriber, cache } = makeSubscriber();
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse({ maxAge: PERMANENT, contexts: ['session'] });
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toBe('UNCACHEABLE (poor cacheability)');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('refuses to cache when the response policy denies', () => {
    const { subscriber, cache } = makeSubscriber({ responsePolicy: denyResponsePolicy });
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse({ maxAge: PERMANENT, contexts: ['route'] });
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toBe('UNCACHEABLE (response policy)');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('refuses to cache when the request policy denied earlier', () => {
    const { subscriber, cache } = makeSubscriber({ requestPolicy: denyPolicy });
    const request = makeRequest();
    subscriber.onRequest(makeRequestEvent(request));
    const response = makeResponse({ maxAge: PERMANENT, contexts: ['route'] });
    subscriber.onResponse({ request, response });
    expect(response.headers.get(DYNAMIC_CACHE_HEADER)).toBe('UNCACHEABLE (request policy)');
    expect(cache.set).not.toHaveBeenCalled();
  });
});
