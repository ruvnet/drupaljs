/**
 * Port of the update module's `#[Hook]`-annotated implementations in
 * `src/Hook/UpdateHooks.php` (the in-scope slice: `hook_help`).
 *
 * Drupal discovers hooks via `#[Hook]` attributes; this port uses the explicit
 * registration API of the ModuleHandler (see @drupaljs/hook). The rich HTML of
 * the original help text is preserved as plain strings; embedded `Url::fromRoute`
 * links are reduced to their route names since URL generation is out of scope.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { UPDATE_MODULE } from './constants.js';

/**
 * Port of `UpdateHooks::help()` (hook_help).
 *
 * Returns help text for the given route, or undefined when the update module
 * provides no help for that route.
 */
export function updateHelp(routeName: string): string | undefined {
  switch (routeName) {
    case 'help.page.update':
      return (
        '<h2>About</h2>' +
        "<p>The Update Status module periodically checks for new versions of your site's software " +
        '(including contributed modules and themes), and alerts administrators to available updates. ' +
        'Note that whenever the Update Status system is used, anonymous usage statistics are sent to Drupal.org.</p>' +
        '<h2>Uses</h2>' +
        '<dl><dt>Checking for available updates</dt>' +
        '<dd>The Available updates report (route: update.status) displays core, contributed modules, ' +
        'and themes for which there are new releases available for download. You can configure the ' +
        'frequency of update checks on the Update Status settings page (route: update.settings).</dd></dl>'
      );
    case 'update.status':
      return (
        '<p>Here you can find information about available updates for your installed modules and themes. ' +
        'Note that each module or theme is part of a "project", which may or may not have the same name, ' +
        'and might include multiple modules or themes within it.</p>'
      );
    case 'system.modules_list':
      return (
        '<p>Regularly review available updates (route: update.status) and update as required to maintain ' +
        'a secure and current site. Always run the update script (route: system.db_update) each time you ' +
        'update software.</p>'
      );
    default:
      return undefined;
  }
}

/**
 * Registers all in-scope update hook implementations against the given handler.
 * Mirrors the `#[Hook('help')]`-annotated method in `src/Hook/UpdateHooks.php`.
 */
export function registerUpdateHooks(handler: ModuleHandlerInterface): void {
  handler.implement(UPDATE_MODULE, 'help', (...args: unknown[]) =>
    updateHelp(args[0] as string),
  );
}
