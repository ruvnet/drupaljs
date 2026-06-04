/**
 * Port of `Drupal\book\BookOutlineStorage` (data-access object for the `book`
 * table) as an in-memory implementation.
 *
 * The original is a thin wrapper over SQL queries against the `book` table. This
 * port keeps the same interface but backs it with an in-memory map so the rest
 * of the module can be exercised without a database. The SQL-backed version
 * will replace this once `@drupaljs/database` and the book schema land
 * (TODO below).
 *
 * TODO(@drupaljs/database): provide a SqlBookOutlineStorage backed by the real
 * `book` table once the database package exposes a query builder.
 */

import type { BookLink, BookOutlineStorageInterface } from './types.js';

export class InMemoryBookOutlineStorage implements BookOutlineStorageInterface {
  /** Outline rows keyed by node id. */
  private readonly links = new Map<number, BookLink>();

  getBooks(): number[] {
    const books: number[] = [];
    for (const link of this.links.values()) {
      if (link.pid === 0 && link.bid === link.nid) {
        books.push(link.nid);
      }
    }
    return books;
  }

  loadMultiple(nids: number[]): BookLink[] {
    // Drupal's loadMultiple expects book ids and returns the full outline for
    // each. We resolve every link whose bid matches one of the requested books,
    // falling back to a direct nid match for non-book ids.
    const books = new Set<number>();
    for (const nid of nids) {
      const seed = this.links.get(nid);
      if (seed) books.add(seed.bid);
      else books.add(nid);
    }
    return [...this.links.values()].filter((l) => books.has(l.bid) || nids.includes(l.nid));
  }

  load(nid: number): BookLink | undefined {
    return this.links.get(nid);
  }

  insert(link: BookLink): BookLink {
    this.links.set(link.nid, { ...link });
    return link;
  }

  update(nid: number, fields: Partial<BookLink>): number {
    const existing = this.links.get(nid);
    if (existing === undefined) {
      return 0;
    }
    this.links.set(nid, { ...existing, ...fields, nid });
    return 1;
  }

  delete(nid: number): number {
    return this.links.delete(nid) ? 1 : 0;
  }

  loadBookChildren(pid: number): BookLink[] {
    return [...this.links.values()]
      .filter((l) => l.pid === pid)
      .sort((a, b) => {
        if (a.weight !== b.weight) return a.weight - b.weight;
        const ta = a.title ?? '';
        const tb = b.title ?? '';
        if (ta !== tb) return ta < tb ? -1 : 1;
        return a.nid - b.nid;
      });
  }
}
