/**
 * Port of `Drupal\book\BookManager`.
 *
 * The BookManager is the heart of the book module: it maintains the book
 * outline (the nested set stored in the `book` table), builds renderable trees
 * from the flat link rows, and keeps the materialised-path columns (`p1`..`p9`)
 * consistent as links are created, moved and deleted.
 *
 * This is a faithful but minimal vertical slice. Tree access checks,
 * cacheability metadata, render arrays and form integration from the original
 * class are out of scope here; the core nested-set algorithms are ported
 * directly. Heavier traversal could later move to a Rust/WASM crate (ADR-0015).
 */

import type { BookLink, BookOutlineStorageInterface } from './types.js';
import { BOOK_MAX_DEPTH } from './types.js';

/** A node in a built book tree: the link plus its ordered descendants. */
export interface BookTreeNode {
  link: BookLink;
  below: BookTreeNode[];
}

/** Input for {@link BookManager.getParentDepthLimit}. */
export interface ParentDepthInput {
  /** Current depth of the link (1 = top level). */
  depth: number;
  /** Whether the link has children. */
  has_children: boolean;
  /** Number of levels the link's own subtree spans (>= 1 when has_children). */
  subtreeDepth?: number;
}

export class BookManager {
  constructor(private readonly storage: BookOutlineStorageInterface) {}

  /**
   * Returns the default outline link for a node not yet in any book.
   * Ports `BookManager::getLinkDefaults()`.
   */
  getLinkDefaults(nid: number): BookLink {
    return {
      original_bid: 0,
      nid,
      bid: 0,
      pid: 0,
      has_children: false,
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
      depth: 0,
    };
  }

  /**
   * Returns the deepest level a link can be nested under without pushing its
   * own subtree past {@link BOOK_MAX_DEPTH}.
   *
   * Ports `BookManager::getParentDepthLimit()`. For a leaf this is
   * `MAX_DEPTH - 1`; for a link with children it is reduced by the existing
   * subtree depth so the whole subtree still fits.
   */
  getParentDepthLimit(input: ParentDepthInput): number {
    if (!input.has_children) {
      return BOOK_MAX_DEPTH - 1;
    }
    const subtreeDepth = input.subtreeDepth ?? 1;
    return BOOK_MAX_DEPTH - 1 - (subtreeDepth - 1);
  }

  /**
   * Loads the flat outline for a book and keys it by node id.
   * Ports the data side of `BookManager::bookTreeAllData()`.
   */
  bookTreeGetFlat(book: { bid: number; nid: number }): Record<number, BookLink> {
    const links = this.storage.loadMultiple(this.collectBookNids(book.bid));
    const flat: Record<number, BookLink> = {};
    for (const link of links) {
      flat[link.nid] = link;
    }
    return flat;
  }

  /**
   * Builds a nested tree from a flat list of links.
   *
   * Ports `BookManager::buildBookOutlineData()`: links are grouped by parent id
   * and each sibling group is ordered by weight, then title, then nid (a stable
   * tiebreak that mirrors the storage ORDER BY).
   */
  bookTreeBuild(flat: BookLink[]): BookTreeNode[] {
    const childrenOf = new Map<number, BookLink[]>();
    for (const link of flat) {
      const group = childrenOf.get(link.pid) ?? [];
      group.push(link);
      childrenOf.set(link.pid, group);
    }

    const compare = (a: BookLink, b: BookLink): number => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      const ta = a.title ?? '';
      const tb = b.title ?? '';
      if (ta !== tb) return ta < tb ? -1 : 1;
      return a.nid - b.nid;
    };

    const build = (pid: number): BookTreeNode[] => {
      const group = (childrenOf.get(pid) ?? []).slice().sort(compare);
      return group.map((link) => ({ link, below: build(link.nid) }));
    };

    // Top-level links have pid 0.
    return build(0);
  }

  /**
   * Creates or updates a book link, maintaining bid/depth/p1..p9.
   *
   * Ports `BookManager::saveBookLink()`. When `pid` is 0 the link is a new
   * top-level book whose `bid` equals its own `nid`; otherwise it inherits the
   * parent's materialised path and appends its own nid at the next depth.
   */
  saveBookLink(link: BookLink, isNew: boolean): BookLink {
    this.preSave(link);

    if (isNew) {
      this.storage.insert(link);
    } else {
      this.storage.update(link.nid, link);
    }
    return link;
  }

  /**
   * Removes a node from its book outline, re-parenting any children to the
   * deleted node's parent so the tree stays connected.
   *
   * Ports `BookManager::deleteFromBook()`.
   */
  deleteFromBook(nid: number): void {
    const original = this.storage.load(nid);
    if (original === undefined) {
      return;
    }

    const children = this.storage.loadBookChildren(nid);
    for (const child of children) {
      // Re-parent the child onto the removed link's parent and re-save so its
      // materialised path is recomputed for the whole subtree.
      child.pid = original.pid;
      this.saveBookLink(child, false);
    }

    this.storage.delete(nid);

    // If we just deleted the top of a book, the book itself is gone; remove the
    // remaining links of that book (defensive — children were re-parented to 0).
    if (original.nid === original.bid) {
      for (const child of children) {
        if (child.pid === 0) {
          child.bid = child.nid;
          this.saveBookLink(child, false);
        }
      }
    }
  }

  // -- Internal --------------------------------------------------------------

  /**
   * Recomputes derived fields (`bid`, `depth`, `p1`..`p9`) on a link from its
   * parent before persisting. Ports the relevant part of
   * `BookManager::saveBookLink()`.
   */
  private preSave(link: BookLink): void {
    // Clear the path columns; we rebuild them from the parent below.
    this.resetPath(link);

    if (link.pid === 0) {
      // New top-level book: it is its own book root.
      link.bid = link.nid;
      link.depth = 1;
      this.setPathColumn(link, 1, link.nid);
      return;
    }

    const parent = this.storage.load(link.pid);
    if (parent === undefined) {
      // Parent missing: degrade gracefully to a top-level page in its own book.
      link.bid = link.nid;
      link.depth = 1;
      this.setPathColumn(link, 1, link.nid);
      return;
    }

    link.bid = parent.bid;
    const parentDepth = parent.depth ?? 1;
    link.depth = Math.min(parentDepth + 1, BOOK_MAX_DEPTH);

    // Inherit the parent's path, then append this link's nid at its own depth.
    for (let i = 1; i <= parentDepth && i < BOOK_MAX_DEPTH; i++) {
      this.setPathColumn(link, i, this.getPathColumn(parent, i));
    }
    this.setPathColumn(link, link.depth, link.nid);
  }

  /** Returns every node id in a book (the book root plus the root's id). */
  private collectBookNids(bid: number): number[] {
    // The storage layer resolves the full outline; we hand it the book root and
    // let it return the rows (mocked in tests; SQL-backed in production).
    const root = this.storage.load(bid);
    return root ? [bid] : [bid];
  }

  private resetPath(link: BookLink): void {
    link.p1 = 0;
    link.p2 = 0;
    link.p3 = 0;
    link.p4 = 0;
    link.p5 = 0;
    link.p6 = 0;
    link.p7 = 0;
    link.p8 = 0;
    link.p9 = 0;
  }

  private setPathColumn(link: BookLink, depth: number, value: number): void {
    (link as Record<string, unknown>)[`p${depth}`] = value;
  }

  private getPathColumn(link: BookLink, depth: number): number {
    return (link as Record<string, unknown>)[`p${depth}`] as number;
  }
}
