/**
 * Port of Drupal\Core\Config\StorageInterface.
 *
 * Allows reading and writing configuration data to and from a backend. Never use
 * a storage directly for active configuration — values lack overrides and writes
 * do not fire config events. Use ConfigFactory instead.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/StorageInterface.php
 */

import type { ConfigData } from './nested-array.js';

/** Static members of {@link StorageInterface}. Exposed for `DEFAULT_COLLECTION`. */
export const StorageInterface = {
  /** The default collection name. */
  DEFAULT_COLLECTION: '',
} as const;

export interface StorageInterface {
  /** Returns whether a configuration object exists. */
  exists(name: string): boolean;

  /** Reads a configuration object's data, or `false` if it does not exist. */
  read(name: string): ConfigData | false;

  /** Reads multiple configuration objects, keyed by the names that existed. */
  readMultiple(names: string[]): Record<string, ConfigData>;

  /** Writes configuration data. Returns `true` on success. */
  write(name: string, data: ConfigData): boolean;

  /** Deletes a configuration object. Returns `true` on success. */
  delete(name: string): boolean;

  /** Renames a configuration object. Returns `true` on success. */
  rename(name: string, newName: string): boolean;

  /** Encodes data into the storage-specific format. */
  encode(data: ConfigData): unknown;

  /** Decodes raw data from the storage-specific format. */
  decode(raw: unknown): ConfigData;

  /** Lists configuration names, optionally filtered by prefix. */
  listAll(prefix?: string): string[];

  /** Deletes configuration objects by prefix. Returns `true` on success. */
  deleteAll(prefix?: string): boolean;

  /** Returns a new storage instance bound to the given collection. */
  createCollection(collection: string): StorageInterface;

  /** Returns the names of all non-empty, non-default collections. */
  getAllCollectionNames(): string[];

  /** Returns the current collection name. */
  getCollectionName(): string;
}
