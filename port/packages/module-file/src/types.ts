/**
 * Local stub types for external dependencies the file module relies on.
 *
 * These mirror the minimal surface of Drupal core services consumed by the
 * `file` module. They are intentionally small and will be replaced by the
 * shared `@drupaljs/*` packages once those export the corresponding contracts.
 */

/**
 * Replace behavior when a destination file already exists.
 *
 * Ports `Drupal\Core\File\FileExists` (drupal-core/core/lib/Drupal/Core/File).
 */
export enum FileExists {
  /** Append a numeric suffix to the destination until it is unique. */
  Rename = 0,
  /** Replace the existing destination file. */
  Replace = 1,
  /** Throw if the destination already exists. */
  Error = 2,
}

/**
 * Minimal config object surface: `config.get(name).get(key)`.
 *
 * TODO(@drupaljs/config): replace with the shared ConfigFactory contract.
 */
export interface ConfigGroup {
  get(key: string): unknown;
}
export interface ConfigFactoryLike {
  get(name: string): ConfigGroup;
}

/**
 * The request-time clock.
 *
 * TODO(@drupaljs/datetime): replace with the shared Time contract
 * (ports Drupal\Component\Datetime\TimeInterface).
 */
export interface TimeLike {
  getRequestTime(): number;
}

/**
 * File-system operations used by {@link FileRepository}.
 *
 * TODO(@drupaljs/file-system): replace with the real FileSystemInterface; the
 * `file-system` package exists but has not exported its contract yet.
 */
export interface FileSystemLike {
  saveData(data: string, destination: string, fileExists: FileExists): string;
  copy(source: string, destination: string, fileExists: FileExists): string;
  move(source: string, destination: string, fileExists: FileExists): string;
}

/**
 * The subset of an entity storage handler the file services use.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityStorageInterface; the
 * `entity` package exists but has not exported its contract yet.
 */
export interface FileStorageLike {
  create(values: Record<string, unknown>): import('./entity/file.js').File;
  save(file: import('./entity/file.js').File): void;
  loadByUri(uri: string): import('./entity/file.js').File | null;
}

/**
 * Nested usage map: module -> object type -> object id -> reference count.
 *
 * Ports the return shape of FileUsageInterface::listUsage().
 */
export type UsageMap = Record<string, Record<string, Record<string, number>>>;
