/**
 * Route definitions for the `big_pipe` module.
 *
 * Source: drupal-core/core/modules/big_pipe/big_pipe.routing.yml
 */

/** A ported route definition (the subset of fields BigPipe uses). */
export interface RouteDefinition {
  path: string;
  defaults: { _controller: string; _title?: string };
  options?: { no_cache?: boolean };
  requirements: { _access: string };
}

/** Ports `big_pipe.routing.yml`. */
export const BIG_PIPE_ROUTES: Record<string, RouteDefinition> = {
  'big_pipe.nojs': {
    path: '/big_pipe/no-js',
    defaults: {
      _controller: 'BigPipeController::setNoJsCookie',
      _title: 'BigPipe no-JS check',
    },
    options: { no_cache: true },
    requirements: { _access: 'TRUE' },
  },
};
