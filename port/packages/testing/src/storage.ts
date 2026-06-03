/**
 * Minimal async key/value storage contract shared across packages. Production
 * backends (Postgres, KV, etc.) implement this; tests use `InMemoryStorage`.
 *
 * Async by design so the same seam works for real I/O-backed stores.
 */
export interface KeyValueStorage<V = unknown> {
  get(key: string): Promise<V | undefined>;
  set(key: string, value: V): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/**
 * In-memory implementation of {@link KeyValueStorage} for tests.
 *
 * Values are deep-cloned on `set` and `get` (via structuredClone) so callers
 * can't mutate stored state through a shared reference — matching the isolation
 * a real serialising store provides.
 */
export class InMemoryStorage<V = unknown> implements KeyValueStorage<V> {
  private readonly map = new Map<string, V>();

  constructor(seed?: Record<string, V>) {
    if (seed) {
      for (const [k, v] of Object.entries(seed)) {
        this.map.set(k, clone(v));
      }
    }
  }

  async get(key: string): Promise<V | undefined> {
    const value = this.map.get(key);
    return value === undefined ? undefined : clone(value);
  }

  async set(key: string, value: V): Promise<void> {
    this.map.set(key, clone(value));
  }

  async has(key: string): Promise<boolean> {
    return this.map.has(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.map.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }

  async clear(): Promise<void> {
    this.map.clear();
  }

  /** Synchronous size accessor for assertions in tests. */
  get size(): number {
    return this.map.size;
  }

  /** Snapshot of current contents for assertions (deep-cloned). */
  snapshot(): Record<string, V> {
    const out: Record<string, V> = {};
    for (const [k, v] of this.map) out[k] = clone(v);
    return out;
  }
}

function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  return structuredClone(value);
}
