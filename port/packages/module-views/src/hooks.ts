import type { ModuleHandlerInterface } from '@drupaljs/hook';

/** The module machine name used when registering these hooks. */
export const VIEWS_MODULE = 'views';

/**
 * Implements `hook_help()` for the views module.
 *
 * Ports the `#[Hook('help')]` implementation in
 * `Drupal\views\Hook\ViewsHooks::help()` (reduced to the module's main help
 * page). Returns markup for a recognised route, or an empty string otherwise.
 */
export function viewsHelp(routeName: string): string {
  if (routeName === 'help.page.views') {
    return (
      'The Views module provides a back end to fulfill several types of data ' +
      'display needs. It can build lists of content, users, comments, and more.'
    );
  }
  return '';
}

/**
 * Registers the views module's hook implementations on a module handler.
 *
 * Mirrors how Drupal discovers `#[Hook]` attributes — here it is explicit per
 * `@drupaljs/hook`'s registration API. Only `hook_help` is wired in this minimal
 * slice; the views lifecycle hooks (`views_pre_build`, `views_pre_execute`,
 * `views_post_execute`) are *fired* by {@link ViewExecutable} and are intended
 * for *other* modules to implement, so views itself does not register them here.
 *
 * Deferred views hook implementations: `views_pre_render`, `views_data`
 * (EntityViewsData), token hooks, theme-suggestion alters, and field-config
 * lifecycle hooks.
 */
export function registerViewsHooks(moduleHandler: ModuleHandlerInterface): void {
  moduleHandler.implement(VIEWS_MODULE, 'help', (routeName: string) => viewsHelp(routeName));
}
