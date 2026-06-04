/**
 * Migrate module hook implementations and their registration against the
 * `@drupaljs/hook` ModuleHandler.
 *
 * Ports `migrate_help()` from migrate.module. In Drupal hooks are discovered via
 * the `#[Hook]` attribute / procedural functions; per @drupaljs/hook's design
 * they are registered explicitly through `ModuleHandler.implement()`.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';

/**
 * Implements hook_help() for the migrate module.
 *
 * Returns help text for the migrate help page route; an empty string for any
 * other route.
 */
export function migrateHelp(routeName: string): string {
  if (routeName === 'help.page.migrate') {
    return (
      'The Migrate module provides a framework for migrating data — typically ' +
      'from an older version of Drupal or another source — into a Drupal site. ' +
      'It provides source, process, and destination plugins coordinated by a ' +
      'migration definition and run by the migrate executable.'
    );
  }
  return '';
}

/**
 * Registers the migrate module's hook implementations on a ModuleHandler.
 * Mirrors what hook discovery would do at module-install time.
 */
export function registerMigrateHooks(moduleHandler: ModuleHandlerInterface): void {
  moduleHandler.implement('migrate', 'help', (...args: unknown[]) =>
    migrateHelp(args[0] as string),
  );
}
