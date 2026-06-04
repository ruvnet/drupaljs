import { describe, it, expect } from 'vitest';
import {
  ResourceResponse,
  ModifiedResourceResponse,
} from './resource-response.js';

describe('ResourceResponse', () => {
  it('stores response data without coercing it to a string body', () => {
    const data = { id: 1, title: 'Hello' };
    const response = new ResourceResponse(data);
    expect(response.getResponseData()).toBe(data);
    // The HTTP body stays empty — data is serialized later by a subscriber.
    expect(response.getContent()).toBe('');
  });

  it('defaults to status 200 and empty headers', () => {
    const response = new ResourceResponse(null);
    expect(response.getStatusCode()).toBe(200);
    expect(response.getHeaders()).toEqual({});
  });

  it('honours an explicit status and headers', () => {
    const response = new ResourceResponse([], 201, { Location: '/node/1' });
    expect(response.getStatusCode()).toBe(201);
    expect(response.getHeaders()).toEqual({ Location: '/node/1' });
  });

  it('is cacheable (carries cacheability metadata)', () => {
    const response = new ResourceResponse({});
    expect(response.isCacheable).toBe(true);
  });
});

describe('ModifiedResourceResponse', () => {
  it('stores response data like ResourceResponse', () => {
    const data = { ok: true };
    const response = new ModifiedResourceResponse(data, 204);
    expect(response.getResponseData()).toBe(data);
    expect(response.getStatusCode()).toBe(204);
  });

  it('is NOT cacheable (modifies a resource)', () => {
    const response = new ModifiedResourceResponse({});
    expect(response.isCacheable).toBe(false);
  });
});
