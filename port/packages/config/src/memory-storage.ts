/**
 * Port of Drupal\Core\Config\MemoryStorage.
 *
 * An in-memory configuration storage. Collections share a single backing store
 * (by reference) so that a storage and its derived collections see each other's
 * data, matching Drupal's `\ArrayObject` sharing.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/MemoryStorage.php
 */

import type { ConfigData } from './nested-array.js';
import { StorageInterface } from './storage.js';

type Backing = Map<string, Map<string, ConfigData>>;

export class MemoryStorage implements StorageInterface {
  private readonly collection: string;
  private readonly config: Backing;

  constructor(
    collection: string = StorageInterface.DEFAULT_COLLECTION,
    backing?: Backing,
  ) {
    this.collection = collection;
    // Collections derived via createCollection() share the backing store.
    this.config = backing ?? new Map();
    if (!this.config.has(collection)) {
      this.config.set(collection, new Map());
    }
  }

  private bucket(): Map<string, ConfigData> {
    let bucket = this.config.get(this.collection);
    if (!bucket) {
      bucket = new Map();
      this.config.set(this.collection, bucket);
    }
    return bucket;
  }

  exists(name: string): boolean {
    const bucket = this.config.get(this.collection);
    return bucket?.has(name) ?? false;
  }

  read(name: string): ConfigData | false {
    if (this.exists(name)) {
      return this.config.get(this.collection)!.get(name)!;
    }
    return false;
  }

  readMultiple(names: string[]): Record<string, ConfigData> {
    const bucket = this.config.get(this.collection);
    const result: Record<string, ConfigData> = {};
    if (!bucket) {
      return result;
    }
    for (const name of names) {
      if (bucket.has(name)) {
        result[name] = bucket.get(name)!;
      }
    }
    return result;
  }

  write(name: string, data: ConfigData): boolean {
    this.bucket().set(name, data);
    return true;
  }

  delete(name: string): boolean {
    const bucket = this.config.get(this.collection);
    if (bucket?.has(name)) {
      bucket.delete(name);
      if (bucket.size === 0) {
        this.config.delete(this.collection);
      }
      return true;
    }
    return false;
  }

  rename(name: string, newName: string): boolean {
    if (!this.exists(name)) {
      return false;
    }
    const bucket = this.bucket();
    bucket.set(newName, bucket.get(name)!);
    bucket.delete(name);
    return true;
  }

  encode(data: ConfigData): unknown {
    return data;
  }

  decode(raw: unknown): ConfigData {
    return raw as ConfigData;
  }

  listAll(prefix = ''): string[] {
    const bucket = this.config.get(this.collection);
    if (!bucket || bucket.size === 0) {
      return [];
    }
    const names = [...bucket.keys()];
    return prefix === '' ? names : names.filter((name) => name.startsWith(prefix));
  }

  deleteAll(prefix = ''): boolean {
    const bucket = this.config.get(this.collection);
    if (!bucket) {
      return false;
    }
    if (prefix === '') {
      this.config.delete(this.collection);
      return true;
    }
    let success = false;
    for (const name of [...bucket.keys()]) {
      if (name.startsWith(prefix)) {
        success = true;
        bucket.delete(name);
      }
    }
    if (bucket.size === 0) {
      this.config.delete(this.collection);
    }
    return success;
  }

  createCollection(collection: string): MemoryStorage {
    // Share the backing store by reference, matching Drupal's ArrayObject.
    return new MemoryStorage(collection, this.config);
  }

  getAllCollectionNames(): string[] {
    const names: string[] = [];
    for (const [name, data] of this.config) {
      if (name !== StorageInterface.DEFAULT_COLLECTION && data.size > 0) {
        names.push(name);
      }
    }
    return names.sort();
  }

  getCollectionName(): string {
    return this.collection;
  }
}
