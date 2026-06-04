/**
 * Route subscriber that opts select routes out of BigPipe.
 *
 * Source: drupal-core/core/modules/big_pipe/src/EventSubscriber/NoBigPipeRouteAlterSubscriber.php
 *
 * Sets the `_no_big_pipe` option on routes that must not be delivered in chunks
 * (the batch page uses a `<meta>` refresh; the modules-list page would lose
 * install status messages behind the no-JS redirect).
 */

import type { RouteBuildEventLike } from './types.js';

/** Routes that opt out of BigPipe. Ports the array in the PHP subscriber. */
export const NO_BIG_PIPE_ROUTES = [
  'system.batch_page.html',
  'system.modules_list',
] as const;

/** The routing ALTER event name. Ports `RoutingEvents::ALTER`. */
export const ROUTING_ALTER_EVENT = 'routing.route_alter';

export class NoBigPipeRouteAlterSubscriber {
  /**
   * Ports `NoBigPipeRouteAlterSubscriber::onRoutingRouteAlterSetNoBigPipe()`.
   */
  onRoutingRouteAlterSetNoBigPipe(event: RouteBuildEventLike): void {
    const collection = event.getRouteCollection();
    for (const name of NO_BIG_PIPE_ROUTES) {
      const route = collection.get(name);
      if (route) {
        route.setOption('_no_big_pipe', true);
      }
    }
  }

  /**
   * Ports `NoBigPipeRouteAlterSubscriber::getSubscribedEvents()`.
   */
  static getSubscribedEvents(): Record<string, string[]> {
    return { [ROUTING_ALTER_EVENT]: ['onRoutingRouteAlterSetNoBigPipe'] };
  }
}
