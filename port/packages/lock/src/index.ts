/**
 * @drupaljs/lock — Distributed lock backend.
 * Port of Drupal\Core\Lock\LockBackendAbstract + DatabaseLockBackend (memory variant).
 * Reference: drupal-core/core/lib/Drupal/Core/Lock/
 */

export interface LockBackendInterface {
  acquire(name: string, timeout?: number): boolean;
  lockMayBeAvailable(name: string): boolean;
  release(name: string): void;
  releaseAll(lockId?: string): void;
  wait(name: string, delay?: number): boolean;
  getLockId(): string;
}

interface LockEntry {
  readonly lockId: string;
  expire: number; // epoch ms — mutable for extend
}

/** Shared lock registry (injected so multiple backends can share state in tests/process). */
export type LockRegistry = Map<string, LockEntry>;

/** Create a new empty shared registry. */
export function createLockRegistry(): LockRegistry {
  return new Map<string, LockEntry>();
}

/**
 * MemoryLockBackend — in-process lock backend for single-threaded environments.
 * Multiple instances sharing the same `registry` see the same lock state.
 * Safe for tests and single-server deployments (no cross-process guarantees).
 *
 * If no `registry` is supplied, each instance owns a fresh, isolated registry.
 * To coordinate locks across multiple backend instances, construct them with a
 * shared registry from {@link createLockRegistry}.
 */
export class MemoryLockBackend implements LockBackendInterface {
  private readonly locks: LockRegistry;
  private readonly lockId: string;

  constructor(lockId?: string, registry?: LockRegistry) {
    this.lockId = lockId ?? generateLockId();
    this.locks = registry ?? createLockRegistry();
  }

  getLockId(): string { return this.lockId; }

  acquire(name: string, timeout = 30): boolean {
    // Clean up expired locks first
    this.releaseExpired();

    const existing = this.locks.get(name);
    if (existing && existing.expire > Date.now() && existing.lockId !== this.lockId) {
      // Held by a different owner and not yet expired.
      return false;
    }

    // Free, expired, or already owned by us: (re)acquire / extend the lock.
    this.locks.set(name, {
      lockId: this.lockId,
      expire: Date.now() + timeout * 1000,
    });
    return true;
  }

  lockMayBeAvailable(name: string): boolean {
    const entry = this.locks.get(name);
    if (!entry) return true;
    if (entry.expire <= Date.now()) {
      this.locks.delete(name);
      return true;
    }
    return false;
  }

  release(name: string): void {
    const entry = this.locks.get(name);
    if (entry?.lockId === this.lockId) {
      this.locks.delete(name);
    }
  }

  releaseAll(lockId?: string): void {
    const targetId = lockId ?? this.lockId;
    for (const [name, entry] of this.locks) {
      if (entry.lockId === targetId) {
        this.locks.delete(name);
      }
    }
  }

  /**
   * Wait polls until the lock is available or the delay expires.
   * In a sync environment this loops immediately; callers that need
   * real async delay should use the async variant or implement a
   * separate scheduler integration.
   */
  wait(name: string, _delay = 30): boolean {
    return this.lockMayBeAvailable(name);
  }

  private releaseExpired(): void {
    const now = Date.now();
    for (const [name, entry] of this.locks) {
      if (entry.expire <= now) {
        this.locks.delete(name);
      }
    }
  }
}

function generateLockId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
