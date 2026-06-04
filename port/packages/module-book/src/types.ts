/**
 * Local contracts for `@drupaljs/module-book`.
 *
 * These model the slice of Drupal core (node entity, entity storage, account)
 * that the book module collaborates with. They stand in for shared `@drupaljs/*`
 * contracts that do not yet exist; replace them with the real packages as they
 * land (TODO markers below).
 */

// ---------------------------------------------------------------------------
// Book link record (a row in Drupal's `book` table)
// ---------------------------------------------------------------------------

/**
 * A single book-outline link, ported from the array structure Drupal's
 * `BookManager` and `BookOutlineStorage` pass around (the `book` table row plus
 * derived runtime fields). In Drupal this is the per-node `$node->book` array.
 *
 * `bid` is the top-level book node id; `nid` is this link's node id; `pid` is
 * the parent link's node id (0 for a top-level page). `p1`..`p9` are the
 * materialised-path columns Drupal uses to query and sort whole subtrees.
 */
export interface BookLink {
  /** Top-level book node id this link belongs to. */
  bid: number;
  /** Node id this link points at. */
  nid: number;
  /** Parent link node id; 0 when this is a top-level page. */
  pid: number;
  /** Sort weight among siblings. */
  weight: number;
  /** Whether the link is expanded in the navigation block. */
  has_children?: boolean;
  /** Materialised-path columns p1..p9 (0 when unused). */
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  /** Depth in the tree (1 = top level). Derived, not stored directly. */
  depth?: number;
  /** Link title (taken from the node). */
  title?: string;
  /** True for a brand-new outline entry not yet persisted. */
  original_bid?: number;
  [key: string]: unknown;
}

/** The maximum nesting depth Drupal's book outline supports (p1..p9). */
export const BOOK_MAX_DEPTH = 9;

// ---------------------------------------------------------------------------
// Node entity (collaborator)
// ---------------------------------------------------------------------------

/**
 * The slice of the node entity the book module reads/writes. Drupal stores the
 * outline link on `$node->book`.
 *
 * TODO(@drupaljs/module-node): replace with the shared NodeInterface once node
 * entity loading is wired across packages.
 */
export interface BookNode {
  id(): number;
  /** Content type / bundle machine name. */
  bundle(): string;
  label(): string;
  /** The attached book-outline link, when this node is in a book. */
  book?: BookLink;
  isNew?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Outline storage (collaborator)
// ---------------------------------------------------------------------------

/**
 * The slice of `Drupal\book\BookOutlineStorageInterface` the manager uses.
 *
 * TODO(@drupaljs/database): back this with the real SQL storage once the schema
 * for the `book` table lands.
 */
export interface BookOutlineStorageInterface {
  /** Returns the node ids that are top-level books. */
  getBooks(): number[];
  /** Loads book links for the given node ids. */
  loadMultiple(nids: number[]): BookLink[];
  /** Loads one book link by node id, or undefined. */
  load(nid: number): BookLink | undefined;
  /** Inserts a new book link; returns it. */
  insert(link: BookLink): BookLink;
  /** Updates an existing book link; returns the number of rows changed. */
  update(nid: number, fields: Partial<BookLink>): number;
  /** Deletes the book link for a node id; returns rows deleted. */
  delete(nid: number): number;
  /** Returns child links of `pid`, ordered by weight then title. */
  loadBookChildren(pid: number): BookLink[];
}

// ---------------------------------------------------------------------------
// Entity storage / manager (collaborators)
// ---------------------------------------------------------------------------

/**
 * The slice of node storage used to load nodes referenced by a book outline.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityStorageInterface.
 */
export interface NodeStorageInterface {
  load(nid: number): BookNode | undefined;
  loadMultiple(nids: number[]): Record<number, BookNode>;
}

/**
 * The slice of `EntityTypeManagerInterface` the module uses.
 *
 * TODO(@drupaljs/entity): replace with the shared EntityTypeManagerInterface.
 */
export interface EntityTypeManagerInterface {
  getStorage(entityTypeId: string): NodeStorageInterface;
}

// ---------------------------------------------------------------------------
// Access (collaborator)
// ---------------------------------------------------------------------------

/**
 * The slice of `AccountInterface` used for permission checks.
 *
 * TODO(@drupaljs/access): replace with the shared AccountInterface.
 */
export interface AccountInterface {
  hasPermission(permission: string): boolean;
}
