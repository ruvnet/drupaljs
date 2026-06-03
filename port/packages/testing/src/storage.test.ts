import { describe, it, expect } from 'vitest';
import { InMemoryStorage } from './storage.js';

describe('InMemoryStorage', () => {
  it('stores and retrieves values', async () => {
    const store = new InMemoryStorage<number>();
    await store.set('a', 1);
    await expect(store.get('a')).resolves.toBe(1);
  });

  it('returns undefined for missing keys', async () => {
    const store = new InMemoryStorage();
    await expect(store.get('missing')).resolves.toBeUndefined();
  });

  it('reports presence with has and removes with delete', async () => {
    const store = new InMemoryStorage<string>();
    await store.set('k', 'v');
    await expect(store.has('k')).resolves.toBe(true);
    await expect(store.delete('k')).resolves.toBe(true);
    await expect(store.has('k')).resolves.toBe(false);
    await expect(store.delete('k')).resolves.toBe(false);
  });

  it('lists keys and clears all entries', async () => {
    const store = new InMemoryStorage<number>({ a: 1, b: 2 });
    await expect(store.keys()).resolves.toEqual(expect.arrayContaining(['a', 'b']));
    expect(store.size).toBe(2);
    await store.clear();
    expect(store.size).toBe(0);
  });

  it('deep-clones on set so external mutation cannot leak in', async () => {
    const store = new InMemoryStorage<{ n: number }>();
    const input = { n: 1 };
    await store.set('obj', input);
    input.n = 99;
    await expect(store.get('obj')).resolves.toEqual({ n: 1 });
  });

  it('deep-clones on get so callers cannot mutate stored state', async () => {
    const store = new InMemoryStorage<{ n: number }>();
    await store.set('obj', { n: 1 });
    const first = await store.get('obj');
    first!.n = 99;
    await expect(store.get('obj')).resolves.toEqual({ n: 1 });
  });

  it('seeds from an initial record (cloned, not shared)', async () => {
    const seed = { x: { n: 1 } };
    const store = new InMemoryStorage<{ n: number }>(seed);
    seed.x.n = 5;
    await expect(store.get('x')).resolves.toEqual({ n: 1 });
  });

  it('snapshot returns a deep-cloned view of contents', async () => {
    const store = new InMemoryStorage<{ n: number }>();
    await store.set('a', { n: 1 });
    const snap = store.snapshot();
    snap.a!.n = 99;
    await expect(store.get('a')).resolves.toEqual({ n: 1 });
  });
});
