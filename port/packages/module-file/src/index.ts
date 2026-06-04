/**
 * @drupaljs/module-file — TypeScript port of Drupal core's `file` module.
 *
 * A faithful, minimal vertical slice of drupal-core/core/modules/file:
 *
 * - **Entity**: the `file` content entity ({@link File}) with status constants,
 *   base-field accessors, download headers, and the preCreate filename hook —
 *   ports `Drupal\file\Entity\File` + `FileInterface`.
 * - **Services**: {@link FileRepository} (write/copy/move/loadByUri) and the
 *   {@link DatabaseFileUsageBackend} usage tracker — port `FileRepository` and
 *   `FileUsage\*`.
 * - **Hooks**: {@link registerFileHooks} wires `hook_cron()` (temporary-file
 *   garbage collection) through `@drupaljs/hook` — ports `Hook\CronHook`.
 * - **Permissions / Routes**: {@link filePermissions} and {@link fileRoutes}
 *   port `file.permissions.yml` and `file.routing.yml`.
 *
 * Deep external collaborators (config, datetime, entity storage, file-system)
 * are consumed through the minimal local contracts in `./types`, each carrying
 * a TODO to swap in the shared `@drupaljs/*` package once it exports a contract.
 */

// Entity
export { File, FileStatus, basename } from './entity/file.js';
export type { FileValues, DownloadHeaders } from './entity/file.js';

// Usage tracking
export { DatabaseFileUsageBackend, FileUsageBase } from './file-usage.js';
export type { FileUsageInterface } from './file-usage.js';

// Repository
export { FileRepository } from './file-repository.js';
export type { FileRepositoryInterface } from './file-repository.js';

// Hooks
export { registerFileHooks, fileCron, FILE_MODULE } from './hooks.js';
export type { FileHookDeps, CronFileStorage } from './hooks.js';

// Permissions & routes
export { filePermissions } from './permissions.js';
export type { PermissionDefinition } from './permissions.js';
export { fileRoutes } from './routing.js';
export type { RouteDefinition } from './routing.js';

// Shared local contracts / enums
export { FileExists } from './types.js';
export type {
  ConfigFactoryLike,
  ConfigGroup,
  TimeLike,
  FileSystemLike,
  FileStorageLike,
  UsageMap,
} from './types.js';
