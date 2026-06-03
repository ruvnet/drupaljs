/**
 * London-school tests for the PageCache middleware (Red first).
 *
 * Mocks the collaborators (kernel closure, cache backend, request/response
 * policies) and asserts both the interactions (cache get/set) and the
 * `X-Drupal-Cache` header outcomes that the PHP middleware produces.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PageCache, X_DRUPAL_CACHE } from './page-cache.js';
import {
  type HttpRequest,
  type HttpResponse,
  type RequestPolicyInterface,
  type ResponsePolicyInterface,
} from '../contracts.js';
import { CacheableMetadata, CACHE_PERMANENT, type CacheBackendInterface } from '../cache.js';

const REQUEST_TIME = 1_000_000;

function makeRequest(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'GET',
    schemeAndHttpHost: 'https://example.com',
    requestUri: '/node/1',
    requestFormat: 'html',
    cookies: {},
    server: { REQUEST_TIME },
    ...overrides,
  };
}

function makeCacheableResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
  const meta = new CacheableMetadata();
  meta.addCacheTags(['node:1']);
  return {
    statusCode: 200,
    content: '<html>hi</html>',
    headers: {},
    vary: [],
    cacheControl: {},
    lastModified: null,
    etag: null,
    expires: null,
    cacheableMetadata: meta,
    setPrivate: vi.fn(),
    ...overrides,
  };
}

function makeBackendMock(): CacheBackendInterface {
  return {
    get: vi.fn().mockReturnValue(false),
    getMultiple: vi.fn().mockReturnValue({}),
    set: vi.fn(),
    setMultiple: vi.fn(),
    delete: vi.fn(),
    deleteMultiple: vi.fn(),
    deleteAll: vi.fn(),
    invalidate: vi.fn(),
    invalidateMultiple: vi.fn(),
    garbageCollection: vi.fn(),
    removeBin: vi.fn(),
  } as unknown as CacheBackendInterface;
}

describe('PageCache middleware', () => {
  let cache: CacheBackendInterface;
  let requestPolicy: RequestPolicyInterface;
  let responsePolicy: ResponsePolicyInterface;

  beforeEach(() => {
    cache = makeBackendMock();
    requestPolicy = { check: vi.fn().mockReturnValue('allow') };
    responsePolicy = { check: vi.fn().mockReturnValue(null) };
  });

  it('passes through and marks UNCACHEABLE (request policy) when policy denies a cacheable method', () => {
    requestPolicy = { check: vi.fn().mockReturnValue(null) };
    const backendResponse = makeCacheableResponse();
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest());

    expect(kernel).toHaveBeenCalledOnce();
    expect(cache.get).not.toHaveBeenCalled();
    expect(res.headers[X_DRUPAL_CACHE]).toBe('UNCACHEABLE (request policy)');
  });

  it('does not set the header for an uncacheable METHOD when request policy denies', () => {
    requestPolicy = { check: vi.fn().mockReturnValue(null) };
    const kernel = vi.fn().mockReturnValue(makeCacheableResponse());
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest({ method: 'POST' }));

    expect(res.headers[X_DRUPAL_CACHE]).toBeUndefined();
  });

  it('returns a HIT from the cache without calling the kernel', () => {
    const cached = makeCacheableResponse();
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue({ data: cached });
    const kernel = vi.fn();
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest());

    expect(kernel).not.toHaveBeenCalled();
    expect(res.headers[X_DRUPAL_CACHE]).toBe('HIT');
    // cache id is schemeAndHttpHost+uri : format
    expect(cache.get).toHaveBeenCalledWith('https://example.com/node/1:html', false);
  });

  it('on a MISS fetches from the kernel, stores the response permanently and marks MISS', () => {
    const backendResponse = makeCacheableResponse();
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest());

    expect(kernel).toHaveBeenCalledOnce();
    expect(res.headers[X_DRUPAL_CACHE]).toBe('MISS');
    expect(cache.set).toHaveBeenCalledWith(
      'https://example.com/node/1:html',
      backendResponse,
      CACHE_PERMANENT,
      ['node:1'],
    );
  });

  it('marks UNCACHEABLE (no cacheability) and does not store a non-cacheable response', () => {
    const backendResponse = makeCacheableResponse();
    // Strip the cacheable metadata: a plain (non-CacheableResponseInterface) response.
    delete (backendResponse as { cacheableMetadata?: unknown }).cacheableMetadata;
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest());

    expect(cache.set).not.toHaveBeenCalled();
    expect(res.headers[X_DRUPAL_CACHE]).toBe('UNCACHEABLE (no cacheability)');
  });

  it('marks UNCACHEABLE (response policy) when the response policy denies', () => {
    responsePolicy = { check: vi.fn().mockReturnValue('deny') };
    const kernel = vi.fn().mockReturnValue(makeCacheableResponse());
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest());

    expect(cache.set).not.toHaveBeenCalled();
    expect(res.headers[X_DRUPAL_CACHE]).toBe('UNCACHEABLE (response policy)');
  });

  it('caches a client error (4xx) for cache_ttl_4xx seconds, not permanently', () => {
    const backendResponse = makeCacheableResponse({ statusCode: 404 });
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy, {
      cacheTtl4xx: 3600,
    });

    mw.handle(makeRequest());

    expect(cache.set).toHaveBeenCalledWith(
      expect.any(String),
      backendResponse,
      REQUEST_TIME + 3600,
      ['node:1'],
    );
  });

  it('does not cache a 4xx when cache_ttl_4xx is 0', () => {
    const backendResponse = makeCacheableResponse({ statusCode: 403 });
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy, {
      cacheTtl4xx: 0,
    });

    mw.handle(makeRequest());

    expect(cache.set).not.toHaveBeenCalled();
  });

  it('marks the response private when there is a session cookie and Vary: Cookie without no-cache', () => {
    const cached = makeCacheableResponse({ vary: ['Cookie'] });
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue({ data: cached });
    const mw = new PageCache(vi.fn(), cache, requestPolicy, responsePolicy, {
      sessionName: 'SESS',
    });

    mw.handle(makeRequest({ cookies: { SESS: 'abc' } }));

    expect(cached.setPrivate).toHaveBeenCalledOnce();
  });

  it('does not mark private when the response carries no-cache', () => {
    const cached = makeCacheableResponse({
      vary: ['Cookie'],
      cacheControl: { 'no-cache': true },
    });
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue({ data: cached });
    const mw = new PageCache(vi.fn(), cache, requestPolicy, responsePolicy, {
      sessionName: 'SESS',
    });

    mw.handle(makeRequest({ cookies: { SESS: 'abc' } }));

    expect(cached.setPrivate).not.toHaveBeenCalled();
  });

  it('returns 304 Not Modified when conditional headers match', () => {
    const cached = makeCacheableResponse({
      lastModified: 500,
      etag: 'v1',
      headers: { 'x-extra': 'drop-me', expires: 'keep-me' },
    });
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue({ data: cached });
    const mw = new PageCache(vi.fn(), cache, requestPolicy, responsePolicy);

    const res = mw.handle(
      makeRequest({
        server: {
          REQUEST_TIME,
          HTTP_IF_MODIFIED_SINCE: 500,
          HTTP_IF_NONE_MATCH: 'v1',
        },
      }),
    );

    expect(res.statusCode).toBe(304);
    expect(res.content).toBeNull();
    // Disallowed headers stripped, allowed ones (expires) kept.
    expect(res.headers['x-extra']).toBeUndefined();
    expect(res.headers.expires).toBe('keep-me');
  });

  it('only caches on the main request (sub-requests pass through untouched)', () => {
    const kernel = vi.fn().mockReturnValue(makeCacheableResponse());
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    const res = mw.handle(makeRequest(), 'sub');

    expect(cache.get).not.toHaveBeenCalled();
    // Sub-request of a cacheable method still annotates request-policy uncacheable.
    expect(res.headers[X_DRUPAL_CACHE]).toBe('UNCACHEABLE (request policy)');
  });

  it('reuses the same cache id across lookup and store within one request', () => {
    const backendResponse = makeCacheableResponse();
    const kernel = vi.fn().mockReturnValue(backendResponse);
    const mw = new PageCache(kernel, cache, requestPolicy, responsePolicy);

    mw.handle(makeRequest({ requestFormat: null }));

    const getCid = (cache.get as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    const setCid = (cache.set as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(getCid).toBe(setCid);
    expect(getCid).toBe('https://example.com/node/1:');
  });
});
