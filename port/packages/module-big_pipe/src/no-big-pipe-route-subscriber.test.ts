import { describe, it, expect, vi } from 'vitest';

import {
  NoBigPipeRouteAlterSubscriber,
  NO_BIG_PIPE_ROUTES,
} from './no-big-pipe-route-subscriber.js';
import type { RouteBuildEventLike, RouteLike } from './types.js';

function mockRoute(): RouteLike {
  const options = new Map<string, unknown>();
  return {
    getOption: (n) => options.get(n) ?? null,
    setOption: vi.fn((n, v) => options.set(n, v)),
  };
}

describe('NoBigPipeRouteAlterSubscriber', () => {
  it('subscribes to the routing ALTER event', () => {
    const events = NoBigPipeRouteAlterSubscriber.getSubscribedEvents();
    expect(events).toHaveProperty('routing.route_alter');
  });

  it('sets _no_big_pipe on the excluded routes when present', () => {
    const routes: Record<string, RouteLike> = {
      'system.batch_page.html': mockRoute(),
      'system.modules_list': mockRoute(),
      'some.other.route': mockRoute(),
    };
    const event: RouteBuildEventLike = {
      getRouteCollection: () => ({ get: (name) => routes[name] }),
    };

    new NoBigPipeRouteAlterSubscriber().onRoutingRouteAlterSetNoBigPipe(event);

    for (const name of NO_BIG_PIPE_ROUTES) {
      expect(routes[name]!.getOption('_no_big_pipe')).toBe(true);
    }
    // Untouched routes are not modified.
    expect(routes['some.other.route']!.getOption('_no_big_pipe')).toBeNull();
  });

  it('ignores excluded routes that are absent from the collection', () => {
    const event: RouteBuildEventLike = {
      getRouteCollection: () => ({ get: () => undefined }),
    };
    expect(() =>
      new NoBigPipeRouteAlterSubscriber().onRoutingRouteAlterSetNoBigPipe(event),
    ).not.toThrow();
  });
});
