import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryTermStorage } from './term-storage.js';
import { Term } from '../entity/term.js';
import { HIERARCHY_DISABLED, HIERARCHY_SINGLE, HIERARCHY_MULTIPLE } from '../types.js';

/**
 * Builds a small hierarchy in vocabulary "tags":
 *
 *   1 Root A         (parent 0)
 *     2 Child A1     (parent 1)
 *       4 Grandchild (parent 2)
 *     3 Child A2     (parent 1)
 *   5 Root B         (parent 0)
 */
function seed(storage: InMemoryTermStorage): void {
  storage.save(new Term({ tid: 1, vid: 'tags', name: 'Root A', weight: 0, parent: [0] }));
  storage.save(new Term({ tid: 2, vid: 'tags', name: 'Child A1', weight: 0, parent: [1] }));
  storage.save(new Term({ tid: 3, vid: 'tags', name: 'Child A2', weight: 1, parent: [1] }));
  storage.save(new Term({ tid: 4, vid: 'tags', name: 'Grandchild', weight: 0, parent: [2] }));
  storage.save(new Term({ tid: 5, vid: 'tags', name: 'Root B', weight: 0, parent: [0] }));
}

describe('InMemoryTermStorage — load / children / parents', () => {
  let storage: InMemoryTermStorage;
  beforeEach(() => {
    storage = new InMemoryTermStorage();
    seed(storage);
  });

  it('loads a single term by id', () => {
    expect(storage.load(2)?.getName()).toBe('Child A1');
    expect(storage.load(99)).toBeUndefined();
  });

  it('loadChildren returns immediate children, optionally restricted by vid', () => {
    expect(storage.loadChildren(1).map((t) => t.id())).toEqual([2, 3]);
    expect(storage.loadChildren(1, 'tags').map((t) => t.id())).toEqual([2, 3]);
    expect(storage.loadChildren(1, 'other')).toEqual([]);
    expect(storage.loadChildren(4)).toEqual([]);
  });

  it('loadParents returns immediate parents (excluding the <root> 0)', () => {
    expect(storage.loadParents(2).map((t) => t.id())).toEqual([1]);
    expect(storage.loadParents(1)).toEqual([]); // root's only parent is 0
  });

  it('loadAllParents returns the term plus all ancestors', () => {
    expect(storage.loadAllParents(4).map((t) => t.id())).toEqual([4, 2, 1]);
    expect(storage.loadAllParents(1).map((t) => t.id())).toEqual([1]);
  });
});

describe('InMemoryTermStorage — loadTree (port of TermStorage::loadTree)', () => {
  let storage: InMemoryTermStorage;
  beforeEach(() => {
    storage = new InMemoryTermStorage();
    seed(storage);
  });

  it('returns a flattened depth-first tree with depth + parents annotations', () => {
    const tree = storage.loadTree('tags');
    expect(tree.map((n) => [n.tid, n.depth])).toEqual([
      [1, 0],
      [2, 1],
      [4, 2],
      [3, 1],
      [5, 0],
    ]);
    const grandchild = tree.find((n) => n.tid === 4)!;
    expect(grandchild.parents).toEqual([2]);
  });

  it('orders siblings by weight then name', () => {
    // Child A1 (weight 0) before Child A2 (weight 1) under parent 1.
    const tree = storage.loadTree('tags', 1);
    expect(tree.map((n) => n.tid)).toEqual([2, 4, 3]);
  });

  it('respects maxDepth (1 = only direct children of the parent)', () => {
    const tree = storage.loadTree('tags', 0, 1);
    expect(tree.map((n) => n.tid)).toEqual([1, 5]);
  });

  it('generates a subtree rooted at a given parent', () => {
    const tree = storage.loadTree('tags', 2);
    expect(tree.map((n) => n.tid)).toEqual([4]);
  });
});

describe('InMemoryTermStorage — getVocabularyHierarchyType', () => {
  it('DISABLED when every term is a root child', () => {
    const storage = new InMemoryTermStorage();
    storage.save(new Term({ tid: 1, vid: 'flat', parent: [0] }));
    storage.save(new Term({ tid: 2, vid: 'flat', parent: [0] }));
    expect(storage.getVocabularyHierarchyType('flat')).toBe(HIERARCHY_DISABLED);
  });

  it('SINGLE when at least one term has one (non-root) parent', () => {
    const storage = new InMemoryTermStorage();
    storage.save(new Term({ tid: 1, vid: 'single', parent: [0] }));
    storage.save(new Term({ tid: 2, vid: 'single', parent: [1] }));
    expect(storage.getVocabularyHierarchyType('single')).toBe(HIERARCHY_SINGLE);
  });

  it('MULTIPLE when at least one term has multiple parents', () => {
    const storage = new InMemoryTermStorage();
    storage.save(new Term({ tid: 1, vid: 'multi', parent: [0] }));
    storage.save(new Term({ tid: 2, vid: 'multi', parent: [0] }));
    storage.save(new Term({ tid: 3, vid: 'multi', parent: [1, 2] }));
    expect(storage.getVocabularyHierarchyType('multi')).toBe(HIERARCHY_MULTIPLE);
  });
});

describe('InMemoryTermStorage — orphan deletion integration with Term.postDelete', () => {
  it('cascades orphan deletion when a parent term is deleted', () => {
    const storage = new InMemoryTermStorage();
    storage.save(new Term({ tid: 1, vid: 'tags', parent: [0] }));
    storage.save(new Term({ tid: 2, vid: 'tags', parent: [1] })); // orphan-to-be

    storage.deleteTerms([storage.load(1)!]);

    expect(storage.load(1)).toBeUndefined();
    expect(storage.load(2)).toBeUndefined(); // orphan removed via postDelete
  });
});
