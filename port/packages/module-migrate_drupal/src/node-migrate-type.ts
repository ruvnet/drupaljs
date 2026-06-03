/**
 * Determines the type of node migration to use and detects the legacy Drupal
 * version of a source database.
 *
 * Ports `Drupal\migrate_drupal\NodeMigrateType` and the
 * `getLegacyDrupalVersion()` method of `MigrationConfigurationTrait`.
 *
 * In Drupal these read the live database via service container singletons
 * (`\Drupal::database()`, `Settings::get()`). The TS port takes the connection
 * and settings as explicit parameters (dependency injection) so the logic is
 * pure and testable.
 */

import type { ConnectionInterface, SettingsInterface } from './contracts.js';

/** Node migration type discriminant. */
export type NodeMigrateTypeValue = 'COMPLETE' | 'CLASSIC';

export const NodeMigrateType = {
  /** Only the complete node migration map tables are in use. */
  NODE_MIGRATE_TYPE_COMPLETE: 'COMPLETE',
  /** Only the classic node migration map tables are in use. */
  NODE_MIGRATE_TYPE_CLASSIC: 'CLASSIC',

  /**
   * Determines the type of node migration to be used.
   *
   * The node complete migration is the default. It is not used when there are
   * existing classic `dN_node` map tables with rows and no complete map rows.
   *
   * Ports `NodeMigrateType::getNodeMigrateType()`.
   *
   * @param connection Connection to the target (destination) database.
   * @param version Source-database major version ('6'/'7'), or `false` if unknown.
   * @param settings Site settings (for `migrate_node_migrate_type_classic`).
   */
  getNodeMigrateType(
    connection: ConnectionInterface,
    version: string | false,
    settings: SettingsInterface,
  ): NodeMigrateTypeValue {
    if (settings.get<boolean>('migrate_node_migrate_type_classic', false)) {
      return NodeMigrateType.NODE_MIGRATE_TYPE_CLASSIC as NodeMigrateTypeValue;
    }

    let migrateType: NodeMigrateTypeValue =
      NodeMigrateType.NODE_MIGRATE_TYPE_COMPLETE as NodeMigrateTypeValue;

    if (version) {
      // Find out which migrate map tables have rows for the node migrations:
      // the classic 'dN_node', the complete 'dN_node_complete', or both.
      let nodeHasRows = false;
      let nodeCompleteHasRows = false;

      const schema = connection.schema();
      const tables = schema.findTables(`migrate_map_d${version}_node%`);

      const bases: Array<['node', 'node'] | ['node_complete', 'node_complete']> = [
        ['node', 'node'],
        ['node_complete', 'node_complete'],
      ];

      for (const [base] of bases) {
        // Match `migrate_map_dN_<base>__<rest>` exactly (double underscore), so
        // 'node' does not also match 'node_complete' tables.
        const pattern = new RegExp(`^migrate_map_d${version}_${base}__.*$`);
        const baseTables = tables.filter((t) => pattern.test(t));
        let hasRows = false;
        for (const baseTable of baseTables) {
          if (schema.tableExists(baseTable) && connection.countRows(baseTable) > 0) {
            hasRows = true;
            break;
          }
        }
        if (base === 'node') {
          nodeHasRows = hasRows;
        } else {
          nodeCompleteHasRows = hasRows;
        }
      }

      if (nodeHasRows && !nodeCompleteHasRows) {
        migrateType = NodeMigrateType.NODE_MIGRATE_TYPE_CLASSIC as NodeMigrateTypeValue;
      }
    }

    return migrateType;
  },
} as const;

/**
 * Determines what major version of Drupal a source database contains.
 *
 * Ports `MigrationConfigurationTrait::getLegacyDrupalVersion()`. Drupal 5/6/7 are
 * detected by the `schema_version` of the `system` module row in the `system`
 * table. Any database error (e.g. missing column) is treated as "not Drupal" and
 * returns `false`.
 *
 * @returns The major branch digit ('5'/'6'/'7'), or `false` if not matched.
 */
export function getLegacyDrupalVersion(connection: ConnectionInterface): string | false {
  let versionString: string | undefined;

  if (connection.schema().tableExists('system')) {
    try {
      const field = connection.queryField(
        'SELECT [schema_version] FROM {system} WHERE [name] = :module',
        { module: 'system' },
      );
      if (field !== undefined && field !== null && field !== false) {
        versionString = String(field);
      }
    } catch {
      // All database errors return false.
    }
  }

  if (versionString === undefined) {
    return false;
  }
  const numeric = Number.parseInt(versionString, 10);
  if (Number.isNaN(numeric)) {
    return false;
  }
  if (numeric >= 6000) {
    return versionString.charAt(0);
  }
  if (numeric >= 1000) {
    return '5';
  }
  return false;
}
