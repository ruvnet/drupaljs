/**
 * @drupaljs/module-migrate_drupal — TypeScript port of Drupal core's
 * `migrate_drupal` module.
 *
 * Provides a framework to migrate data from previous versions of Drupal (6/7/8)
 * into the site. This module ships no user interface and no permissions; it is a
 * framework consumed by the migrate UI and Drush.
 *
 * Vertical slice ported here:
 *   - `NodeMigrateType` + `getLegacyDrupalVersion` (source version + node migrate
 *     type detection) — see node-migrate-type.ts
 *   - `MigrateFieldPluginManager` + `FieldPluginBase` + reference field plugins
 *     — see field/*
 *   - `MigrateDrupalHooks` (hook_help, hook_migration_plugins_alter) registered
 *     via @drupaljs/hook — see hooks.ts
 *
 * Deferred deep dependencies are stubbed with LOCAL types + TODOs in contracts.ts
 * (Database connection, migration plugin manager, full Migration object, Settings).
 */

import type { PermissionMap, RouteCollection } from './contracts.js';

export * from './contracts.js';
export * from './node-migrate-type.js';
export * from './field/field-plugin-base.js';
export * from './field/reference.js';
export * from './field/field-plugin-manager.js';
export * from './hooks.js';

/**
 * Module descriptor — the relevant fields of `migrate_drupal.info.yml`.
 *
 * TODO(@drupaljs/extension): replace `dependencies` shape with the shared
 * Extension info type once the extension package lands.
 */
export const MIGRATE_DRUPAL_MODULE = {
  name: 'migrate_drupal',
  type: 'module' as const,
  description:
    'Provides a framework to migrate data from previous versions of Drupal into the site.',
  package: 'Migration',
  lifecycle: 'deprecated' as const,
  // .info.yml lists `drupal:migrate` and `drupal:phpass`; machine names only.
  dependencies: ['migrate', 'phpass'] as const,
} as const;

/**
 * Permissions provided by migrate_drupal.
 *
 * The module ships no `*.permissions.yml`; it defines no permissions. Returned
 * empty for parity with sibling module packages.
 */
export function migrateDrupalPermissions(): PermissionMap {
  return {};
}

/**
 * Routes provided by migrate_drupal.
 *
 * The module proper ships no `*.routing.yml`; the only route it participates in
 * is the core help page route, included here so the help hook has a target.
 *
 * TODO(@drupaljs/routing): fold into the shared route registry when available.
 */
export function migrateDrupalRoutes(): RouteCollection {
  return {
    'help.page.migrate_drupal': {
      path: '/admin/help/migrate_drupal',
      defaults: {
        _controller: 'help.page:helpPage',
        name: 'migrate_drupal',
      },
      requirements: {
        _permission: 'access administration pages',
      },
    },
  };
}
