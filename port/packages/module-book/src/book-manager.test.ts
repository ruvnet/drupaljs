import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookManager } from './book-manager.js';
import type { BookOutlineStorageInterface, BookLink } from './types.js';

/** Builds a fully-formed BookLink with p1..p9 defaulted to 0. */
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

function mockStorage(): BookOutlineStorageInterface {
  return {
    getBooks: vi.fn(() => []),
    loadMultiple: vi.fn(() => []),
    load: vi.fn(() => undefined),
    insert: vi.fn((l: BookLink) => l),
    update: vi.fn(() => 1),
    delete: vi.fn(() => 1),
    loadBookChildren: vi.fn(() => []),
  };
}

describe('BookManager.getLinkDefaults', () => {
  it('returns a fresh top-level outline link for a node', () => {
    const manager = new BookManager(mockStorage());
    const defaults = manager.getLinkDefaults(42);
    expect(defaults).toMatchObject({ nid: 42, bid: 0, pid: 0, weight: 0, has_children: false });
    expect(defaults.original_bid).toBe(0);
  });
});

describe('BookManager.getParentDepthLimit', () => {
  it('limits a top-level page to depth allowing the full tree', () => {
    const manager = new BookManager(mockStorage());
    // A leaf (no children) at depth 1 may be nested up to MAX_DEPTH - 1.
    expect(manager.getParentDepthLimit({ depth: 1, has_children: false })).toBe(8);
  });

  it('reduces the limit by the existing subtree depth', () => {
    const manager = new BookManager(mockStorage());
    // A link whose subtree already spans 3 levels has less room to be nested.
    const limit = manager.getParentDepthLimit({ depth: 1, has_children: true, subtreeDepth: 3 });
    expect(limit).toBe(8 - (3 - 1));
  });
});

describe('BookManager.bookTreeBuild', () => {
  it('nests flat links into a tree by parent id, ordered by weight', () => {
    const manager = new BookManager(mockStorage());
    const flat: BookLink[] = [
      link({ nid: 1, bid: 1, pid: 0, weight: 0, p1: 1, depth: 1, title: 'Root' }),
      link({ nid: 3, bid: 1, pid: 1, weight: 5, p1: 1, p2: 3, depth: 2, title: 'Child B' }),
      link({ nid: 2, bid: 1, pid: 1, weight: -5, p1: 1, p2: 2, depth: 2, title: 'Child A' }),
      link({ nid: 4, bid: 1, pid: 2, weight: 0, p1: 1, p2: 2, p3: 4, depth: 3, title: 'Grandchild' }),
    ];
    const tree = manager.bookTreeBuild(flat);

    expect(tree).toHaveLength(1);
    const root = tree[0]!;
    expect(root.link.nid).toBe(1);
    // Children ordered by weight: Child A (-5) before Child B (5).
    expect(root.below.map((c) => c.link.nid)).toEqual([2, 3]);
    expect(root.below[0]!.below.map((c) => c.link.nid)).toEqual([4]);
    expect(root.below[1]!.below).toEqual([]);
  });
});

describe('BookManager.bookTreeGetFlat', () => {
  it('flattens a loaded book outline keyed by nid', () => {
    const storage = mockStorage();
    const links: BookLink[] = [
      link({ nid: 1, bid: 1, pid: 0, p1: 1, depth: 1 }),
      link({ nid: 2, bid: 1, pid: 1, p1: 1, p2: 2, depth: 2 }),
    ];
    (storage.loadMultiple as ReturnType<typeof vi.fn>).mockReturnValue(links);
    const manager = new BookManager(storage);
    const flat = manager.bookTreeGetFlat({ bid: 1, nid: 1 });
    expect(Object.keys(flat)).toEqual(['1', '2']);
    expect(flat[1]!.title).toBeUndefined();
  });
});

describe('BookManager.saveBookLink', () => {
  it('inserts a new link and computes its materialised path from the parent', () => {
    const storage = mockStorage();
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(
      link({ nid: 1, bid: 1, pid: 0, p1: 1, depth: 1 }),
    );
    const manager = new BookManager(storage);

    const newLink: BookLink = link({ nid: 5, bid: 1, pid: 1, weight: 2 });
    manager.saveBookLink(newLink, true);

    expect(storage.insert).toHaveBeenCalledTimes(1);
    const saved = (storage.insert as ReturnType<typeof vi.fn>).mock.calls[0]![0] as BookLink;
    // The child inherits the parent's path and appends its own nid at depth 2.
    expect(saved.p1).toBe(1);
    expect(saved.p2).toBe(5);
    expect(saved.depth).toBe(2);
  });

  it('treats a pid of 0 as a new top-level book (bid == nid)', () => {
    const storage = mockStorage();
    const manager = new BookManager(storage);
    const newLink: BookLink = link({ nid: 7, bid: 7, pid: 0 });
    manager.saveBookLink(newLink, true);

    const saved = (storage.insert as ReturnType<typeof vi.fn>).mock.calls[0]![0] as BookLink;
    expect(saved.bid).toBe(7);
    expect(saved.p1).toBe(7);
    expect(saved.depth).toBe(1);
  });

  it('updates an existing link instead of inserting', () => {
    const storage = mockStorage();
    (storage.load as ReturnType<typeof vi.fn>).mockImplementation((nid: number) =>
      nid === 5 ? link({ nid: 5, bid: 1, pid: 0, p1: 5, depth: 1 }) : undefined,
    );
    const manager = new BookManager(storage);
    const existing: BookLink = link({ nid: 5, bid: 1, pid: 0, p1: 5, depth: 1, weight: 9 });
    manager.saveBookLink(existing, false);

    expect(storage.update).toHaveBeenCalledTimes(1);
    expect(storage.insert).not.toHaveBeenCalled();
  });
});

describe('BookManager.deleteFromBook', () => {
  it('relinks children to the deleted node parent and removes the link', () => {
    const storage = mockStorage();
    (storage.load as ReturnType<typeof vi.fn>).mockReturnValue(
      link({ nid: 2, bid: 1, pid: 1, p1: 1, p2: 2, depth: 2 }),
    );
    (storage.loadBookChildren as ReturnType<typeof vi.fn>).mockReturnValue([
      link({ nid: 4, bid: 1, pid: 2, p1: 1, p2: 2, p3: 4, depth: 3 }),
    ]);
    const manager = new BookManager(storage);

    manager.deleteFromBook(2);

    // The child gets re-parented to the deleted node's parent (pid 1)...
    const reparented = (storage.update as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[0] === 4,
    );
    expect(reparented).toBeDefined();
    expect((reparented![1] as Partial<BookLink>).pid).toBe(1);
    // ...and the node's own link is deleted.
    expect(storage.delete).toHaveBeenCalledWith(2);
  });
});
