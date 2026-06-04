import { describe, it, expect } from 'vitest';

import { BIG_PIPE_ROUTES } from './routes.js';

describe('BIG_PIPE_ROUTES', () => {
  it('defines the big_pipe.nojs route', () => {
    const route = BIG_PIPE_ROUTES['big_pipe.nojs'];
    expect(route).toBeDefined();
    expect(route.path).toBe('/big_pipe/no-js');
  });

  it('routes to BigPipeController::setNoJsCookie with public access', () => {
    const route = BIG_PIPE_ROUTES['big_pipe.nojs'];
    expect(route.defaults._controller).toContain('setNoJsCookie');
    expect(route.requirements._access).toBe('TRUE');
  });

  it('marks the route as no_cache', () => {
    expect(BIG_PIPE_ROUTES['big_pipe.nojs'].options?.no_cache).toBe(true);
  });
});
