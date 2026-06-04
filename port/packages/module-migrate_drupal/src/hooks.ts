/**
 * Hook implementations for the migrate_drupal module.
 *
 * Ports `Drupal\migrate_drupal\Hook\MigrateDrupalHooks`. The PHP class is
 * discovered via `#[Hook]` attributes; the TS port exposes the implementations
 * as methods plus an explicit {@link registerMigrateDrupalHooks} that wires them
 * into a `@drupaljs/hook` ModuleHandler.
 *
 * The taxonomy-vocabulary branch of `migration_plugins_alter` (which runs a stub
 * migration to derive forum field names) depends on the live migration plugin
 * manager + source database and is deferred — see the TODO inline. The
 * node-classic→complete dependency rewrite is fully ported here, as it is the
 * substantive, testable behaviour.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { MigrationDefinitions } from './contracts.js';
import { NodeMigrateType, type NodeMigrateTypeValue } from './node-migrate-type.js';

/**
 * Matches a classic node migration id and captures the version digit (1), the
 * node migration base (2), and the trailing `$`/`:derivative` part (3).
 *
 * Ports the PHP pattern
 * `/d([67])_(node|node_translation|node_revision|node_entity_translation)($|:.*)/`.
 */
const CLASSIC_NODE_MIGRATION = /d([67])_(node|node_translation|node_revision|node_entity_translation)($|:.*)/;

/** Replacement target: the complete node migration for the same version. */
function toCompleteMigration(value: string): string {
  return value.replace(CLASSIC_NODE_MIGRATION, 'd$1_node_complete$3');
}

/** Recursively rewrites every string in a value via {@link toCompleteMigration}. */
function rewriteRecursive(value: unknown): unknown {
  if (typeof value === 'string') {
    return toCompleteMigration(value);
  }
  if (Array.isArray(value)) {
    return value.map(rewriteRecursive);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rewriteRecursive(v);
    }
    return out;
  }
  return value;
}

/**
 * For all non-classic-node migrations, replaces any dependency on a classic node
 * migration with a dependency on the complete node migration.
 *
 * Ports the `array_walk_recursive` loop of `migrationPluginsAlter()`.
 */
export function rewriteClassicNodeDependencies(definitions: MigrationDefinitions): void {
  for (const definition of Object.values(definitions)) {
    const isClassicNode = CLASSIC_NODE_MIGRATION.test(definition.id);
    const deps = definition.migration_dependencies;
    if (!isClassicNode && deps !== undefined) {
      definition.migration_dependencies = rewriteRecursive(deps) as NonNullable<
        MigrationDefinitions[string]['migration_dependencies']
      >;
    }
  }
}

/** Context the alter hook needs from the environment (injected, not global). */
export interface MigrationPluginsAlterContext {
  /** Whether a destination module is enabled (models module_handler.moduleExists). */
  moduleExists(module: string): boolean;
  /**
   * The resolved node migrate type. In Drupal this is computed inside the hook
   * via {@link NodeMigrateType.getNodeMigrateType} using the live databases; the
   * port injects it so the hook stays pure and testable.
   */
  nodeMigrateType: NodeMigrateTypeValue;
}

export class MigrateDrupalHooks {
  /**
   * Implements hook_help().
   *
   * Ports `MigrateDrupalHooks::help()`. The original builds URLs via the routing
   * system; the port inlines the documentation link and a relative help path.
   */
  help(routeName: string): string | null {
    if (routeName === 'help.page.migrate_drupal') {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Migrate Drupal module provides a framework based on the ' +
        '<a href="/admin/help/migrate">Migrate module</a> to facilitate ' +
        'migration from a Drupal (6, 7, or 8) site to your website. It does not ' +
        'provide a user interface. For more information, see the ' +
        '<a href="https://www.drupal.org/documentation/modules/migrate_drupal">' +
        'online documentation for the Migrate Drupal module</a>.</p>';
      return output;
    }
    return null;
  }

  /**
   * Implements hook_migration_plugins_alter().
   *
   * Ports `MigrateDrupalHooks::migrationPluginsAlter()`. When the node module is
   * enabled and the node migrate type is COMPLETE, rewrites classic node
   * migration dependencies to the complete equivalent.
   *
   * TODO(taxonomy): the original also derives forum/term-node field names by
   * running a stub `d6_taxonomy_vocabulary` migration. That branch needs the live
   * migration plugin manager + source database and is deferred until those land.
   */
  migrationPluginsAlter(
    definitions: MigrationDefinitions,
    context: MigrationPluginsAlterContext,
  ): void {
    if (!context.moduleExists('node')) {
      return;
    }
    if (
      context.nodeMigrateType === NodeMigrateType.NODE_MIGRATE_TYPE_COMPLETE
    ) {
      rewriteClassicNodeDependencies(definitions);
    }
  }
}

/**
 * Registers the migrate_drupal hook implementations on a ModuleHandler.
 *
 * The `migration_plugins_alter` registration adapts the `alter` calling
 * convention (mutate `data` by reference) to the method signature; the alter
 * context must be supplied by the caller via the second alter argument.
 */
export function registerMigrateDrupalHooks(
  handler: ModuleHandlerInterface,
  hooks: MigrateDrupalHooks,
): void {
  handler.implement('migrate_drupal', 'help', (routeName: string) => hooks.help(routeName));
  handler.implement(
    'migrate_drupal',
    'migration_plugins_alter',
    (definitions: MigrationDefinitions, context: MigrationPluginsAlterContext) =>
      hooks.migrationPluginsAlter(definitions, context),
  );
}
