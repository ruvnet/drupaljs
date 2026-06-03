/**
 * Port of `Drupal\taxonomy\TermStorage` (core/modules/taxonomy/src/TermStorage.php).
 *
 * The upstream storage is SQL-backed; this is an in-memory implementation
 * suitable for the port's test/runtime harness. It faithfully reproduces the
 * tree-walking algorithm of `TermStorage::loadTree()` (iterative depth-first
 * with depth + parents annotations) and the hierarchy classification of
 * `getVocabularyHierarchyType()`.
 *
 * TODO(@drupaljs/database): provide a SQL-backed storage implementing the same
 * interface once the database package lands.
 */

import { Term } from '../entity/term.js';
import {
  HIERARCHY_DISABLED,
  HIERARCHY_SINGLE,
  HIERARCHY_MULTIPLE,
  type HierarchyType,
  type MinimalTermStorage,
  type TermInterface,
} from '../types.js';

/** A flattened tree node, mirroring the objects yielded by loadTree(). */
export interface TermTreeNode {
  readonly tid: number;
  readonly vid: string;
  readonly name: string;
  readonly weight: number;
  /** Depth from the requested parent (root request => 0 for top level). */
  depth: number;
  /** The immediate parent ids of this term. */
  parents: number[];
}

export class InMemoryTermStorage implements MinimalTermStorage {
  /** tid -> Term. */
  private readonly terms = new Map<number, Term>();

  // -- CRUD ----------------------------------------------------------------

  save(term: Term): void {
    const tid = term.id();
    if (tid === undefined) {
      throw new Error('InMemoryTermStorage.save requires a term with an id (tid).');
    }
    // Bind save() so storage-managed re-saves persist the (mutated) instance.
    (term as unknown as { save(): void }).save = () => this.save(term);
    this.terms.set(tid, term);
  }

  load(tid: number): Term | undefined {
    return this.terms.get(tid);
  }

  /** Implements the {@link MinimalTermStorage} delete used by Term.postDelete. */
  delete(terms: TermInterface[]): void {
    for (const term of terms) {
      const tid = term.id();
      if (tid !== undefined) this.terms.delete(tid);
    }
  }

  /**
   * Public delete entry point — removes the terms then runs the entity
   * postDelete lifecycle (orphan handling), matching how Drupal's entity
   * storage invokes `Term::postDelete()`.
   */
  deleteTerms(terms: TermInterface[]): void {
    this.delete(terms);
    Term.postDelete(this, terms);
  }

  // -- Relationships -------------------------------------------------------

  /** Port of loadChildren(): immediate children of $tid (optionally in $vid). */
  loadChildren(tid: number, vid?: string): Term[] {
    return this.sorted(
      [...this.terms.values()].filter(
        (t) => t.getParentIds().includes(tid) && (vid === undefined || t.bundle() === vid),
      ),
    );
  }

  /** Port of loadParents(): immediate parents of $tid, excluding <root> (0). */
  loadParents(tid: number): Term[] {
    const term = this.terms.get(tid);
    if (term === undefined) return [];
    return term
      .getParentIds()
      .filter((p) => p !== 0)
      .map((p) => this.terms.get(p))
      .filter((t): t is Term => t !== undefined);
  }

  /** Port of loadAllParents(): the term itself plus all ancestors. */
  loadAllParents(tid: number): Term[] {
    const result: Term[] = [];
    const seen = new Set<number>();
    const queue: number[] = [tid];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (seen.has(current)) continue;
      seen.add(current);
      const term = this.terms.get(current);
      if (term === undefined) continue;
      result.push(term);
      for (const p of term.getParentIds()) {
        if (p !== 0 && !seen.has(p)) queue.push(p);
      }
    }
    return result;
  }

  // -- Tree ----------------------------------------------------------------

  /**
   * Port of `TermStorage::loadTree()`.
   *
   * Returns a numerically indexed (depth-first) array of tree nodes annotated
   * with `depth` and `parents`. Uses the same iterative parent-stack walk as
   * upstream to avoid recursion and to keep multi-parent terms correct.
   */
  loadTree(vid: string, parent = 0, maxDepth?: number): TermTreeNode[] {
    // Build the per-vocabulary child/parent maps (weight, then name ordered).
    const treeChildren = new Map<number, number[]>();
    const treeParents = new Map<number, number[]>();
    const treeTerms = new Map<number, Term>();

    for (const term of this.sorted([...this.terms.values()].filter((t) => t.bundle() === vid))) {
      const tid = term.id()!;
      treeTerms.set(tid, term);
      for (const p of term.getParentIds()) {
        const children = treeChildren.get(p) ?? [];
        children.push(tid);
        treeChildren.set(p, children);
        const parents = treeParents.get(tid) ?? [];
        parents.push(p);
        treeParents.set(tid, parents);
      }
    }

    const depthLimit = maxDepth ?? treeChildren.size;
    const tree: TermTreeNode[] = [];

    // Iterative depth-first walk via a parent stack; per-parent cursor tracks
    // how many children of each parent have been emitted (replaces PHP's
    // internal array pointer + next()/current()).
    const processParents: number[] = [parent];
    const cursor = new Map<number, number>();

    while (processParents.length > 0) {
      const currentParent = processParents[processParents.length - 1]!;
      const depth = processParents.length - 1;
      const children = treeChildren.get(currentParent) ?? [];

      if (depth >= depthLimit || children.length === 0) {
        processParents.pop();
        cursor.set(currentParent, 0);
        continue;
      }

      let index = cursor.get(currentParent) ?? 0;
      let descended = false;
      while (index < children.length) {
        const childTid = children[index]!;
        index += 1;
        const term = treeTerms.get(childTid)!;
        tree.push({
          tid: childTid,
          vid: term.bundle(),
          name: term.getName(),
          weight: term.getWeight(),
          depth,
          parents: treeParents.get(childTid) ?? [],
        });
        const grandChildren = treeChildren.get(childTid) ?? [];
        if (grandChildren.length > 0) {
          cursor.set(currentParent, index);
          processParents.push(childTid);
          descended = true;
          break;
        }
      }
      if (!descended) {
        cursor.set(currentParent, index);
        if (index >= children.length) {
          processParents.pop();
          cursor.set(currentParent, 0);
        }
      }
    }

    return tree;
  }

  // -- Classification ------------------------------------------------------

  /** Port of getVocabularyHierarchyType(). */
  getVocabularyHierarchyType(vid: string): HierarchyType {
    let type: HierarchyType = HIERARCHY_DISABLED;
    for (const term of this.terms.values()) {
      if (term.bundle() !== vid) continue;
      const realParents = term.getParentIds().filter((p) => p !== 0);
      if (realParents.length > 1) {
        return HIERARCHY_MULTIPLE; // strongest classification; short-circuit.
      }
      if (realParents.length === 1 && type === HIERARCHY_DISABLED) {
        type = HIERARCHY_SINGLE;
      }
    }
    return type;
  }

  // -- Internal ------------------------------------------------------------

  /** Orders terms by ascending weight, then by name (matches loadTree SQL). */
  private sorted(terms: Term[]): Term[] {
    return [...terms].sort((a, b) => {
      const byWeight = a.getWeight() - b.getWeight();
      if (byWeight !== 0) return byWeight;
      const an = a.getName();
      const bn = b.getName();
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
  }
}
