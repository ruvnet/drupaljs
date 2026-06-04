/**
 * REST module hook implementations — TypeScript port of a slice of
 * `core/modules/rest/src/Hook/RestHooks.php`.
 *
 * Drupal 11 declares hooks with `#[Hook('name')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose a plain function
 * plus {@link registerRestHooks}, which registers it on a `@drupaljs/hook`
 * ModuleHandler via its explicit `implement()` API (the TS-idiomatic equivalent
 * of attribute discovery).
 *
 * Ported hook: `hook_help` for `help.page.rest`. The PHP original interpolates
 * links to other modules' help pages via the routing/Url services; those are
 * not yet ported, so the markup uses the documentation URLs the PHP falls back
 * to when those modules are absent.
 */

/**
 * Minimal handler surface needed to register a hook. Subset of
 * `@drupaljs/hook` ModuleHandlerInterface (only `implement`).
 *
 * TODO(@drupaljs/hook): import ModuleHandlerInterface directly once this package
 * depends on @drupaljs/hook in the workspace.
 */
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: unknown[]) => unknown): void;
}

/**
 * Implements hook_help(): returns help markup for a route, or null when the
 * rest module has no help for it (faithful to the PHP `?string` return).
 */
export function restHelp(routeName: string): string | null {
  if (routeName !== 'help.page.rest') {
    return null;
  }
  let output = '';
  output += '<h2>About</h2>';
  output +=
    '<p>The RESTful Web Services module provides a framework for exposing REST ' +
    'resources on your site. It provides support for content entity types such ' +
    'as the main site content, comments, content blocks, taxonomy terms, and ' +
    'user accounts, etc. REST support for content items of the Node module is ' +
    'installed by default, and support for other types of content entities can ' +
    'be enabled. For more information, see the ' +
    '<a href="https://www.drupal.org/documentation/modules/rest">online ' +
    'documentation for the RESTful Web Services module</a>.</p>';
  output += '<h2>Uses</h2>';
  output += '<dl>';
  output += '<dt>Installing supporting modules</dt>';
  output +=
    '<dd>In order to use REST on a website, you need to install modules that ' +
    'provide serialization and authentication services.</dd>';
  output += '<dt>Enabling REST support for an entity type</dt>';
  output +=
    '<dd>REST support for content types is enabled by default. To enable support ' +
    'for other content entity types, you can use a process based on configuration ' +
    'editing or the contributed REST UI module.</dd>';
  output += '</dl>';
  return output;
}

/** Registers the rest module's hook implementations on a ModuleHandler. */
export function registerRestHooks(handler: HookRegistrar): void {
  handler.implement('rest', 'help', (routeName: unknown) => restHelp(routeName as string));
}
