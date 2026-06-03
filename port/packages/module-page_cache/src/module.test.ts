/**
 * Tests for the page_cache module metadata: info, permissions, routes,
 * and service-definition descriptors (Red first).
 */
import { describe, it, expect } from 'vitest';
import { pageCacheInfo, pageCachePermissions, pageCacheRoutes, pageCacheServices } from './module.js';

describe('pageCacheInfo', () => {
  it('mirrors page_cache.info.yml core fields', () => {
    expect(pageCacheInfo.name).toBe('Internal Page Cache');
    expect(pageCacheInfo.type).toBe('module');
    expect(pageCacheInfo.package).toBe('Core');
  });
});

describe('pageCachePermissions', () => {
  it('defines no permissions (page_cache has none in Drupal core)', () => {
    expect(pageCachePermissions).toEqual({});
  });
});

describe('pageCacheRoutes', () => {
  it('defines no routes (page_cache exposes none in Drupal core)', () => {
    expect(pageCacheRoutes).toEqual({});
  });
});

describe('pageCacheServices', () => {
  it('describes the page_cache middleware service faithful to page_cache.services.yml', () => {
    const mw = pageCacheServices['http_middleware.page_cache'];
    expect(mw).toBeDefined();
    expect(mw!.arguments).toEqual([
      '@cache.page',
      '@page_cache_request_policy',
      '@page_cache_response_policy',
    ]);
    expect(mw!.tags).toContainEqual({ name: 'http_middleware', priority: 200 });
  });

  it('describes the cache.page bin service', () => {
    const bin = pageCacheServices['cache.page'];
    expect(bin).toBeDefined();
    expect(bin!.tags).toContainEqual({ name: 'cache.bin' });
  });
});
