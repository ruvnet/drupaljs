/**
 * page_cache hook implementations — TypeScript port of
 * `core/modules/page_cache/src/Hook/PageCacheHooks.php`.
 *
 * Drupal 11 declares hooks via `#[Hook('name')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose plain functions
 * plus {@link registerPageCacheHooks}, which registers them on a `@drupaljs/hook`
 * ModuleHandler via its explicit `implement()` API.
 *
 * page_cache implements only `hook_help`.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/**
 * Implements hook_help(): returns help markup for `help.page.page_cache`,
 * or null for any other route (faithful to the PHP `?string` return).
 *
 * The PHP original interpolates a Dynamic Page Cache help URL and the
 * performance-settings URL via the routing/URL subsystem; those are not ported
 * yet, so this slice renders the static prose with literal anchor placeholders.
 * TODO(@drupaljs/routing): resolve `:dynamic_page_cache-help` and
 *   `:cache-settings` via Url::fromRoute once routing lands.
 */
export function pageCacheHelp(routeName: string): string | null {
  if (routeName !== 'help.page.page_cache') {
    return null;
  }
  let output = '<h2>About</h2>';
  output +=
    '<p>The Internal Page Cache module caches pages for anonymous users in the ' +
    'database. For more information, see the <a href="https://www.drupal.org/documentation/modules/internal_page_cache">' +
    'online documentation for the Internal Page Cache module</a>.</p>';
  output += '<h2>Uses</h2>';
  output += '<dl>';
  output += '<dt>Speeding up your site</dt>';
  output +=
    '<dd>Pages requested by anonymous users are stored the first time they are ' +
    'requested and then are reused. Depending on your site configuration and the ' +
    'amount of your web traffic tied to anonymous visitors, the caching system ' +
    'may significantly increase the speed of your site.</dd>';
  output +=
    '<dd>Pages are usually identical for all anonymous users, while they can be ' +
    'personalized for each authenticated user. This is why entire pages can be ' +
    'cached for anonymous users, whereas they will have to be rebuilt for every ' +
    'authenticated user.</dd>';
  output +=
    '<dd>To speed up your site for authenticated users, see the ' +
    '<a href="#">Dynamic Page Cache module</a>.</dd>';
  output += '<dt>Configuring the internal page cache</dt>';
  output +=
    '<dd>On the <a href="#">Performance page</a>, you can configure how long ' +
    'browsers and proxies may cache pages based on the Cache-Control header; this ' +
    'setting is ignored by the Internal Page Cache module, which caches pages ' +
    'permanently until invalidation, unless they carry an Expires header. There ' +
    'is no other configuration.</dd>';
  output += '</dl>';
  return output;
}

/** Registers page_cache's hook implementations on a ModuleHandler. */
export function registerPageCacheHooks(handler: ModuleHandlerInterface): void {
  handler.implement('page_cache', 'help', (routeName: unknown) =>
    pageCacheHelp(routeName as string),
  );
}
