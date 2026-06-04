import { describe, it, expect, vi } from 'vitest';
import { Term } from './term.js';
import type { MinimalTermStorage, TermInterface } from '../types.js';

describe('Term entity — accessors (port of Term.php getters/setters)', () => {
  it('exposes name/description/format/weight via getters and chainable setters', () => {
    const term = new Term({ tid: 1, vid: 'tags', name: 'Apple', description: 'A fruit', format: 'basic_html', weight: 3 });
    expect(term.id()).toBe(1);
    expect(term.bundle()).toBe('tags');
    expect(term.getName()).toBe('Apple');
    expect(term.getDescription()).toBe('A fruit');
    expect(term.getFormat()).toBe('basic_html');
    expect(term.getWeight()).toBe(3);

    expect(term.setName('Banana')).toBe(term); // chainable
    term.setDescription('Yellow').setFormat('full_html').setWeight(7);
    expect(term.getName()).toBe('Banana');
    expect(term.getDescription()).toBe('Yellow');
    expect(term.getFormat()).toBe('full_html');
    expect(term.getWeight()).toBe(7);
  });

  it('defaults: empty name, weight 0, undefined format/description coalesced', () => {
    const term = new Term({ vid: 'tags' });
    expect(term.getName()).toBe('');
    expect(term.getDescription()).toBe('');
    expect(term.getWeight()).toBe(0);
    expect(term.id()).toBeUndefined();
  });
});

describe('Term entity — preSave (root-parent default)', () => {
  it('assigns the <root> parent (0) when a term has no parents', () => {
    const term = new Term({ vid: 'tags', name: 'Orphan' });
    expect(term.getParentIds()).toEqual([]);
    term.preSave();
    expect(term.getParentIds()).toEqual([0]);
  });

  it('leaves explicit parents untouched on preSave', () => {
    const term = new Term({ vid: 'tags', name: 'Child', parent: [5] });
    term.preSave();
    expect(term.getParentIds()).toEqual([5]);
  });
});

describe('Term entity — postDelete (orphan handling)', () => {
  it('deletes children that become orphans and saves children with surviving parents', () => {
    const deleted = new Term({ tid: 1, vid: 'tags', name: 'Parent' });

    // child A: only parent is the deleted term -> becomes orphan -> deleted.
    const childA = new Term({ tid: 2, vid: 'tags', name: 'A', parent: [1] });
    // child B: has another parent (9) -> survives, re-saved with parent stripped.
    const childB = new Term({ tid: 3, vid: 'tags', name: 'B', parent: [1, 9] });
    const saveB = vi.spyOn(childB, 'save');

    const storage: MinimalTermStorage = {
      loadChildren: vi.fn((tid: number) => (tid === 1 ? [childA, childB] : [])),
      delete: vi.fn(),
    };

    Term.postDelete(storage, [deleted]);

    // Orphan childA collected for deletion; childB saved (not deleted).
    expect(storage.delete).toHaveBeenCalledTimes(1);
    const orphans = (storage.delete as unknown as { mock: { calls: TermInterface[][] } }).mock.calls[0]![0];
    expect(orphans).toEqual([childA]);
    expect(childB.getParentIds()).toEqual([9]); // deleted parent filtered out
    expect(saveB).toHaveBeenCalledOnce();
  });

  it('does nothing when the deleted term has no children', () => {
    const term = new Term({ tid: 1, vid: 'tags' });
    const storage: MinimalTermStorage = {
      loadChildren: vi.fn(() => []),
      delete: vi.fn(),
    };
    Term.postDelete(storage, [term]);
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
