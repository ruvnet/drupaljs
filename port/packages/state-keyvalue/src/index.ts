/**
 * @drupaljs/state-keyvalue — State API + Key-Value store.
 * Port of Drupal\Core\State\State + Drupal\Core\KeyValueStore\*.
 * Reference: drupal-core/core/lib/Drupal/Core/State/ + KeyValueStore/
 */

export interface KeyValueStoreInterface {
  get<T = unknown>(key: string): T | undefined;
  getMultiple<T = unknown>(keys: string[]): Record<string, T>;
  getAll<T = unknown>(): Record<string, T>;
  set(key: string, value: unknown): void;
  setMany(data: Record<string, unknown>): void;
  setIfNotExists(key: string, value: unknown): boolean;
  rename(key: string, newKey: string): void;
  delete(key: string): void;
  deleteMultiple(keys: string[]): void;
  deleteAll(): void;
}

export interface KeyValueFactoryInterface {
  get(collection: string): KeyValueStoreInterface;
}

/**
 * MemoryKeyValueStore — in-memory key-value store for a single collection.
 */
export class MemoryKeyValueStore implements KeyValueStoreInterface {
  private readonly data = new Map<string, unknown>();

  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  getMultiple<T = unknown>(keys: string[]): Record<string, T> {
    const result: Record<string, T> = {};
    for (const key of keys) {
      if (this.data.has(key)) {
        result[key] = this.data.get(key) as T;
      }
    }
    return result;
  }

  getAll<T = unknown>(): Record<string, T> {
    return Object.fromEntries(this.data) as Record<string, T>;
  }

  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  setMany(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      this.data.set(key, value);
    }
  }

  setIfNotExists(key: string, value: unknown): boolean {
    if (this.data.has(key)) return false;
    this.data.set(key, value);
    return true;
  }

  rename(key: string, newKey: string): void {
    if (this.data.has(key)) {
      this.data.set(newKey, this.data.get(key));
      this.data.delete(key);
    }
  }

  delete(key: string): void { this.data.delete(key); }

  deleteMultiple(keys: string[]): void { keys.forEach(k => this.data.delete(k)); }

  deleteAll(): void { this.data.clear(); }
}

/**
 * MemoryKeyValueFactory — creates/caches in-memory stores per collection.
 */
export class MemoryKeyValueFactory implements KeyValueFactoryInterface {
  private readonly collections = new Map<string, MemoryKeyValueStore>();

  get(collection: string): MemoryKeyValueStore {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new MemoryKeyValueStore());
    }
    return this.collections.get(collection)!;
  }
}

/**
 * State — system state API backed by a key-value store.
 * Port of Drupal\Core\State\State.
 */
export class State {
  private cache: Map<string, unknown> = new Map();

  constructor(private readonly store: KeyValueStoreInterface) {}

  get<T = unknown>(key: string): T | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    const value = this.store.get<T>(key);
    if (value !== undefined) {
      this.cache.set(key, value);
    }
    return value;
  }

  getMultiple(keys: string[]): Record<string, unknown> {
    const missing: string[] = [];
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (this.cache.has(key)) {
        result[key] = this.cache.get(key);
      } else {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      const fetched = this.store.getMultiple(missing);
      for (const [key, value] of Object.entries(fetched)) {
        this.cache.set(key, value);
        result[key] = value;
      }
    }
    return result;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
    this.cache.set(key, value);
  }

  setMultiple(data: Record<string, unknown>): void {
    this.store.setMany(data);
    for (const [key, value] of Object.entries(data)) {
      this.cache.set(key, value);
    }
  }

  delete(key: string): void {
    this.store.delete(key);
    this.cache.delete(key);
  }

  deleteMultiple(keys: string[]): void {
    this.store.deleteMultiple(keys);
    keys.forEach(k => this.cache.delete(k));
  }

  resetCache(): void { this.cache.clear(); }
}
