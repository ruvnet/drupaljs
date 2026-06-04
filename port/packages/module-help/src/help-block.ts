/**
 * Help block plugin — TypeScript port of
 * `core/modules/help/src/Plugin/Block/HelpBlock.php`.
 *
 * The 'help_block' block collects page-level help by invoking `hook_help` for
 * every implementing module with the current route name, wrapping each
 * non-empty string result in a `#markup` render array. It is hidden on 403/404
 * pages. Cache contexts include `route` (help varies per page).
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/** A render array element produced by the help block. */
export type HelpBlockElement = { '#markup': string } | Record<string, unknown>;

/**
 * Minimal current-request/route surface the block needs.
 *
 * TODO(@drupaljs/http-kernel): replace `request.hasException` with the shared
 * Request attribute bag once available; for now we model only what the block
 * reads (the `exception` attribute presence + the current route name).
 */
export interface HelpBlockContext {
  /** True when the request carries an `exception` attribute (403/404). */
  hasException: boolean;
  /** The current route name (RouteMatch::getRouteName()). */
  routeName: string;
}

/**
 * Builds the help block render array.
 *
 * Faithful to `HelpBlock::build()`:
 *  - returns `[]` on an exception (error) page;
 *  - otherwise invokes hook_help for each module with the route name, and
 *    appends any non-empty result (strings wrapped in `#markup`).
 */
export function buildHelpBlock(
  context: HelpBlockContext,
  moduleHandler: ModuleHandlerInterface,
): HelpBlockElement[] {
  if (context.hasException) {
    return [];
  }

  const build: HelpBlockElement[] = [];
  moduleHandler.invokeAllWith('help', (hook) => {
    const help = hook(context.routeName);
    // Don't add empty results to the build array.
    if (help === null || help === undefined || help === '') {
      return;
    }
    build.push(
      typeof help === 'object'
        ? (help as Record<string, unknown>)
        : { '#markup': String(help) },
    );
  });
  return build;
}

/**
 * The cache contexts the help block varies by. Ports
 * `HelpBlock::getCacheContexts()` (parent contexts + `route`); the parent
 * BlockBase contexts are represented by the caller-supplied base list.
 */
export function helpBlockCacheContexts(baseContexts: string[] = []): string[] {
  return Array.from(new Set([...baseContexts, 'route']));
}
