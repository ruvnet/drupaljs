/**
 * File usage tracking.
 *
 * Ports `Drupal\file\FileUsage\FileUsageInterface`, `FileUsageBase`, and
 * `DatabaseFileUsageBackend` from drupal-core/core/modules/file/src/FileUsage.
 * The persistent `file_usage` table is replaced by an in-memory store keyed by
 * file id for this slice; swapping in a real backend only requires reimplementing
 * the three private store accessors.
 */

import type { File } from './entity/file.js';
import type { ConfigFactoryLike, UsageMap } from './types.js';

/**
 * Records and queries which modules/objects reference a file.
 * Ports FileUsageInterface.
 */
export interface FileUsageInterface {
  /** Records that `module` uses `file` via object `type`/`id`, `count` times. */
  add(file: File, module: string, type: string, id: string, count?: number): void;
  /**
   * Removes `count` references. With `count = 0`, removes all references for the
   * `type`/`id`. With `type`/`id` omitted, removes all references for `module`.
   */
  delete(file: File, module: string, type?: string | null, id?: string | null, count?: number): void;
  /** Returns the nested usage map for a file. */
  listUsage(file: File): UsageMap;
}

/**
 * Base class implementing the shared add/delete side effects (permanent on use,
 * temporary on last-removal). Ports FileUsageBase.
 */
export abstract class FileUsageBase implements FileUsageInterface {
  protected readonly configFactory: ConfigFactoryLike;

  constructor(configFactory: ConfigFactoryLike) {
    this.configFactory = configFactory;
  }

  add(file: File, _module: string, _type: string, _id: string, _count = 1): void {
    // Make sure that a used file is permanent.
    if (!file.isPermanent()) {
      file.setPermanent();
    }
  }

  delete(file: File, _module: string, _type: string | null = null, _id: string | null = null, _count = 1): void {
    // Do not mark files temporary when the behavior is disabled.
    if (!this.configFactory.get('file.settings').get('make_unused_managed_files_temporary')) {
      return;
    }
    // If no usages remain, mark the file temporary (cron will remove it).
    if (Object.keys(this.listUsage(file)).length === 0) {
      file.setTemporary();
    }
  }

  abstract listUsage(file: File): UsageMap;
}

/**
 * In-memory backend for the `file_usage` records. Ports
 * DatabaseFileUsageBackend; the SQL merge/delete/select are replaced by a Map.
 *
 * TODO(@drupaljs/database): back this with the real Connection once available.
 */
export class DatabaseFileUsageBackend extends FileUsageBase {
  /** fileId -> module -> type -> id -> count */
  private readonly store = new Map<number, UsageMap>();

  override add(file: File, module: string, type: string, id: string, count = 1): void {
    const usage = this.usageFor(file);
    const byModule = (usage[module] ??= {});
    const byType = (byModule[type] ??= {});
    byType[id] = (byType[id] ?? 0) + count;
    super.add(file, module, type, id, count);
  }

  override delete(
    file: File,
    module: string,
    type: string | null = null,
    id: string | null = null,
    count = 1,
  ): void {
    const usage = this.store.get(this.key(file));
    if (usage !== undefined) {
      this.decrement(usage, module, type, id, count);
      if (Object.keys(usage).length === 0) {
        this.store.delete(this.key(file));
      }
    }
    super.delete(file, module, type, id, count);
  }

  listUsage(file: File): UsageMap {
    // Return a defensive deep copy so callers cannot mutate internal state.
    return structuredClone(this.store.get(this.key(file)) ?? {});
  }

  // -- internals -----------------------------------------------------------

  private usageFor(file: File): UsageMap {
    const k = this.key(file);
    let usage = this.store.get(k);
    if (usage === undefined) {
      usage = {};
      this.store.set(k, usage);
    }
    return usage;
  }

  private key(file: File): number {
    if (file.id === null) {
      throw new Error('Cannot track usage for an unsaved file (no file id).');
    }
    return file.id;
  }

  /** Applies a delete to the nested map, pruning empty branches. */
  private decrement(
    usage: UsageMap,
    module: string,
    type: string | null,
    id: string | null,
    count: number,
  ): void {
    const modules = type === null ? Object.keys(usage) : [module];
    for (const m of modules) {
      const byModule = usage[m];
      if (byModule === undefined) continue;
      const types = type === null ? Object.keys(byModule) : [type];
      for (const t of types) {
        const byType = byModule[t];
        if (byType === undefined) continue;
        const ids = id === null ? Object.keys(byType) : [id];
        for (const i of ids) {
          if (byType[i] === undefined) continue;
          // count = 0 removes all references for this id (Drupal semantics).
          if (count === 0 || byType[i]! - count <= 0) {
            delete byType[i];
          } else {
            byType[i] = byType[i]! - count;
          }
        }
        if (Object.keys(byType).length === 0) delete byModule[t];
      }
      if (Object.keys(byModule).length === 0) delete usage[m];
    }
  }
}
