/**
 * dynamic_page_cache hook implementations — TypeScript port of
 * `core/modules/dynamic_page_cache/src/Hook/DynamicPageCacheHooks.php`.
 *
 * Drupal 11 declares hooks with `#[Hook('help')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose a plain function
 * plus {@link registerDynamicPageCacheHooks}, which registers it on a
 * `@drupaljs/hook` ModuleHandler via its explicit `implement()` API.
 *
 * Ported hooks: `hook_help`.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/**
 * Implements hook_help(): returns help markup for a route, or null when the
 * module has no help for it (faithful to the PHP `?string` return).
 */
export function dynamicPageCacheHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.dynamic_page_cache': {
      let output = '<h2>About</h2>';
      output +=
        '<p>The Internal Dynamic Page Cache module caches pages for all users in the database, ' +
        'handling dynamic content correctly. For more information, see the ' +
        '<a href="https://www.drupal.org/documentation/modules/dynamic_page_cache">online documentation ' +
        'for the Internal Dynamic Page Cache module</a>.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Speeding up your site</dt>';
      output +=
        '<dd>Pages which are suitable for caching are cached the first time they are requested, ' +
        'then the cached version is served for all later requests. Dynamic content is handled ' +
        'automatically so that both cache correctness and hit ratio is maintained.</dd>';
      output +=
        '<dd>The module requires no configuration. Every part of the page contains metadata that ' +
        'allows Internal Dynamic Page Cache to figure this out on its own.</dd>';
      output += '</dl>';
      return output;
    }
    default:
      return null;
  }
}

/** Registers the dynamic_page_cache module's hook implementations. */
export function registerDynamicPageCacheHooks(handler: ModuleHandlerInterface): void {
  handler.implement('dynamic_page_cache', 'help', (routeName: unknown) =>
    dynamicPageCacheHelp(routeName as string),
  );
}
