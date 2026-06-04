/**
 * @drupaljs/module-migrate — TypeScript port of the core of Drupal's `migrate`
 * module (drupal-core/core/modules/migrate).
 *
 * Public surface:
 *  - Row: the source/destination value carrier (Drupal\migrate\Row).
 *  - MigrateExecutable: drives source -> process -> destination (import/processRow).
 *  - Plugin trio: EmbeddedDataSource (source), Get (process), EntityContentDestination
 *    (destination), plus ProcessPluginBase.
 *  - Contracts: status/result/message enums, exceptions, and plugin interfaces.
 *  - Module wiring: hooks (hook_help), permissions, routes.
 */

// Contracts: enums, exceptions, plugin interfaces, permission/route shapes.
export {
  IdMapStatus,
  RollbackAction,
  MigrationStatus,
  MigrationResult,
  MessageLevel,
  MigrateException,
  MigrateSkipProcessException,
  MigrateSkipRowException,
} from './contracts.js';
export type {
  MigrateMessageInterface,
  MigrateSourceInterface,
  MigrateProcessInterface,
  MigrateDestinationInterface,
  MigrationInterface,
  MigrateExecutableInterface,
  FieldDefinitions,
  PermissionDefinition,
  PermissionMap,
  RouteDefinition,
  RouteCollection,
} from './contracts.js';

// Core value object + executable.
export { Row } from './row.js';
export type { IdMap } from './row.js';
export { MigrateExecutable } from './migrate-executable.js';

// Plugin trio + base.
export { EmbeddedDataSource } from './plugin/embedded-data-source.js';
export type { EmbeddedDataConfig } from './plugin/embedded-data-source.js';
export { ProcessPluginBase } from './plugin/process-plugin-base.js';
export { Get } from './plugin/get.js';
export { EntityContentDestination } from './plugin/entity-content-destination.js';
export type {
  EntityStorage,
  EntityContentConfig,
} from './plugin/entity-content-destination.js';

// Module wiring.
export { migrateHelp, registerMigrateHooks } from './hooks.js';
export { migratePermissions } from './permissions.js';
export { migrateRoutes } from './routes.js';
