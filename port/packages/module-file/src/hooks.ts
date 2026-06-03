/**
 * File module hook implementations, registered with `@drupaljs/hook`.
 *
 * Ports the hook classes under drupal-core/core/modules/file/src/Hook. The
 * vertical slice implements `hook_cron()` (temporary-file garbage collection,
 * ported from CronHook) wired through the ModuleHandler registration API
 * ([[ADR]] @drupaljs/hook: explicit `implement()` replaces PHP attribute
 * discovery). Additional hook classes can register here as they are ported.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { File } from './entity/file.js';
import type { ConfigFactoryLike, TimeLike } from './types.js';
import type { FileUsageInterface } from './file-usage.js';

/** The module machine name used when registering implementations. */
export const FILE_MODULE = 'file';

/**
 * Storage surface used by hook_cron(). A thin adapter over the file entity
 * storage; `getExpiredTemporary` ports the entity query in CronHook.
 *
 * TODO(@drupaljs/entity): replace with the real EntityStorage query API.
 */
export interface CronFileStorage {
  /**
   * Returns up to 100 ids of temporary files whose `changed` time is older than
   * `now - maxAge`. Ports the `status <> PERMANENT AND changed < cutoff` query.
   */
  getExpiredTemporary(cutoff: number, limit: number): number[];
  load(id: number): File | null;
  delete(file: File): void;
}

/** Dependencies injected into the file module hooks (DI, ADR-style). */
export interface FileHookDeps {
  config: ConfigFactoryLike;
  time: TimeLike;
  fileStorage: CronFileStorage;
  fileUsage: Pick<FileUsageInterface, 'listUsage'>;
}

/**
 * Registers the file module's hook implementations on a ModuleHandler.
 * Ports CronHook (hook_cron) — temporary-file garbage collection.
 */
export function registerFileHooks(handler: ModuleHandlerInterface, deps: FileHookDeps): void {
  handler.implement(FILE_MODULE, 'cron', () => {
    fileCron(deps);
  });
}

/**
 * Implements hook_cron(): deletes unused temporary files older than
 * `system.file:temporary_maximum_age`. Cleanup is disabled when the age is 0.
 * Ports CronHook::__invoke().
 */
export function fileCron(deps: FileHookDeps): void {
  const age = Number(deps.config.get('system.file').get('temporary_maximum_age')) || 0;
  // Automatic cleanup is disabled when the age is 0.
  if (age <= 0) {
    return;
  }

  const cutoff = deps.time.getRequestTime() - age;
  const ids = deps.fileStorage.getExpiredTemporary(cutoff, 100);
  for (const id of ids) {
    const file = deps.fileStorage.load(id);
    if (file === null) continue;
    const references = deps.fileUsage.listUsage(file);
    // Only delete the file when no module still references it.
    if (Object.keys(references).length === 0) {
      deps.fileStorage.delete(file);
    }
  }
}
