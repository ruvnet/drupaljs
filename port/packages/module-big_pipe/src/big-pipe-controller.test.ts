import { describe, it, expect } from 'vitest';

import {
  BigPipeController,
  AccessDeniedHttpException,
  BadRequestHttpException,
} from './big-pipe-controller.js';
import { NOJS_COOKIE } from './big-pipe-strategy.js';
import type { RequestLike } from './types.js';

function mockRequest(opts: {
  nojsCookie?: boolean;
  destination?: string | null;
}): RequestLike {
  return {
    cookies: { has: (n) => n === NOJS_COOKIE && !!opts.nojsCookie },
    query: {
      has: (n) => n === 'destination' && opts.destination != null,
      get: (n) => (n === 'destination' ? (opts.destination ?? null) : null),
    },
    isMethodCacheable: () => true,
  };
}

describe('BigPipeController.setNoJsCookie', () => {
  const controller = new BigPipeController();

  it('denies access when the no-JS cookie is already set (redirect loop)', () => {
    expect(() =>
      controller.setNoJsCookie(mockRequest({ nojsCookie: true, destination: '/x' })),
    ).toThrow(AccessDeniedHttpException);
  });

  it('throws 400 when the destination query argument is missing', () => {
    expect(() =>
      controller.setNoJsCookie(mockRequest({ destination: null })),
    ).toThrow(BadRequestHttpException);
  });

  it('returns a redirect to destination that sets the no-JS cookie', () => {
    const response = controller.setNoJsCookie(
      mockRequest({ destination: '/node/1' }),
    );
    expect(response.targetUrl).toBe('/node/1');
    expect(response.cookies.find((c) => c.name === NOJS_COOKIE)).toBeDefined();
    expect(response.cacheContexts).toContain('session.exists');
    expect(response.cacheContexts).toContain(`cookies:${NOJS_COOKIE}`);
  });

  it('sets the cookie without httpOnly so JS can delete it', () => {
    const response = controller.setNoJsCookie(
      mockRequest({ destination: '/' }),
    );
    const cookie = response.cookies.find((c) => c.name === NOJS_COOKIE)!;
    expect(cookie.httpOnly).toBe(false);
  });
});
