import { describe, it, expect } from 'vitest';
import { MemoryLockBackend, createLockRegistry } from './index.js';

describe('MemoryLockBackend', () => {
  it('acquire returns true for a free lock', () => {
    const lock = new MemoryLockBackend('owner1');
    expect(lock.acquire('my_lock')).toBe(true);
  });
  it('acquire returns false when lock is held by another', () => {
    const registry = createLockRegistry();
    const lock1 = new MemoryLockBackend('owner1', registry);
    const lock2 = new MemoryLockBackend('owner2', registry);
    lock1.acquire('shared_lock');
    expect(lock2.acquire('shared_lock')).toBe(false);
  });
  it('same owner can re-acquire (extend)', () => {
    const lock = new MemoryLockBackend('owner1');
    lock.acquire('my_lock');
    expect(lock.acquire('my_lock')).toBe(true);
  });
  it('release frees the lock for others', () => {
    const registry = createLockRegistry();
    const lock1 = new MemoryLockBackend('owner1', registry);
    const lock2 = new MemoryLockBackend('owner2', registry);
    lock1.acquire('shared_lock');
    lock1.release('shared_lock');
    expect(lock2.acquire('shared_lock')).toBe(true);
  });
  it('release ignores locks held by others', () => {
    const registry = createLockRegistry();
    const lock1 = new MemoryLockBackend('owner1', registry);
    const lock2 = new MemoryLockBackend('owner2', registry);
    lock1.acquire('shared_lock');
    lock2.release('shared_lock'); // should be no-op
    expect(lock1.lockMayBeAvailable('shared_lock')).toBe(false);
  });
  it('releaseAll frees all locks by this owner', () => {
    const lock = new MemoryLockBackend('owner1');
    lock.acquire('lock_a'); lock.acquire('lock_b');
    lock.releaseAll();
    expect(lock.lockMayBeAvailable('lock_a')).toBe(true);
    expect(lock.lockMayBeAvailable('lock_b')).toBe(true);
  });
  it('lockMayBeAvailable returns true for free locks', () => {
    const lock = new MemoryLockBackend('owner1');
    expect(lock.lockMayBeAvailable('free_lock')).toBe(true);
  });
  it('expired locks become available', () => {
    const lock = new MemoryLockBackend('owner1');
    // Acquire with 0 timeout (already expired)
    lock.acquire('expiring', 0);
    expect(lock.lockMayBeAvailable('expiring')).toBe(true);
  });
  it('getLockId returns a stable non-empty string', () => {
    const lock = new MemoryLockBackend('test-id');
    expect(lock.getLockId()).toBe('test-id');
  });
  it('wait returns true when lock is available', () => {
    const lock = new MemoryLockBackend('owner1');
    expect(lock.wait('free')).toBe(true);
  });
  it('wait returns false when lock is still held', () => {
    const registry = createLockRegistry();
    const lock1 = new MemoryLockBackend('owner1', registry);
    const lock2 = new MemoryLockBackend('owner2', registry);
    lock1.acquire('held', 60);
    expect(lock2.wait('held')).toBe(false);
  });
});
