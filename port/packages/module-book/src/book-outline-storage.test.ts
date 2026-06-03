import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryBookOutlineStorage } from './book-outline-storage.js';
import type { BookLink } from './types.js';

function link(partial: Partial<BookLink> & Pick<BookLink, 'nid' | 'bid' | 'pid'>): BookLink {
  return {
    weight: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    p4: 0,
    p5: 0,
    p6: 0,
    p7: 0,
    p8: 0,
    p9: 0,
    ...partial,
  };
}

describe('InMemoryBookOutlineStorage', () => {
  let storage: InMemoryBookOutlineStorage;

  beforeEach(() => {
    storage = new InMemoryBookOutlineStorage();
  });

  it('inserts and loads a link by nid', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0, p1: 1, depth: 1 }));
    expect(storage.load(1)).toMatchObject({ nid: 1, bid: 1 });
    expect(storage.load(99)).toBeUndefined();
  });

  it('lists top-level books (pid 0 and bid == nid)', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0, p1: 1, depth: 1 }));
    storage.insert(link({ nid: 2, bid: 1, pid: 1, p1: 1, p2: 2, depth: 2 }));
    storage.insert(link({ nid: 5, bid: 5, pid: 0, p1: 5, depth: 1 }));
    expect(storage.getBooks().sort()).toEqual([1, 5]);
  });

  it('updates an existing link and reports rows changed', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0, weight: 0 }));
    expect(storage.update(1, { weight: 7 })).toBe(1);
    expect(storage.load(1)!.weight).toBe(7);
    expect(storage.update(404, { weight: 1 })).toBe(0);
  });

  it('deletes a link and reports rows removed', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0 }));
    expect(storage.delete(1)).toBe(1);
    expect(storage.load(1)).toBeUndefined();
    expect(storage.delete(1)).toBe(0);
  });

  it('loads children of a parent ordered by weight then title', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0, p1: 1, depth: 1 }));
    storage.insert(link({ nid: 3, bid: 1, pid: 1, weight: 5, title: 'B' }));
    storage.insert(link({ nid: 2, bid: 1, pid: 1, weight: -5, title: 'A' }));
    expect(storage.loadBookChildren(1).map((l) => l.nid)).toEqual([2, 3]);
  });

  it('loads multiple links for a book id', () => {
    storage.insert(link({ nid: 1, bid: 1, pid: 0, p1: 1 }));
    storage.insert(link({ nid: 2, bid: 1, pid: 1, p1: 1, p2: 2 }));
    storage.insert(link({ nid: 9, bid: 9, pid: 0, p1: 9 }));
    const all = storage.loadMultiple([1]);
    // loadMultiple([bid]) returns all links of that book, not just the root.
    expect(all.map((l) => l.nid).sort()).toEqual([1, 2]);
  });
});
