import { describe, it, expect } from 'vitest';
import { TaxonomyPermissions } from './permissions.js';
import { staticPermissions } from './permissions.js';
import { Vocabulary } from './entity/vocabulary.js';

describe('TaxonomyPermissions — dynamic per-vocabulary permissions', () => {
  it('builds six permissions per vocabulary keyed by vocabulary id', () => {
    const perms = new TaxonomyPermissions();
    const result = perms.permissions([
      new Vocabulary({ vid: 'tags', name: 'Tags' }),
    ]);
    expect(Object.keys(result)).toEqual([
      'create terms in tags',
      'delete terms in tags',
      'edit terms in tags',
      'view term revisions in tags',
      'revert term revisions in tags',
      'delete term revisions in tags',
    ]);
    expect(result['create terms in tags']).toEqual({ title: 'Tags: Create terms' });
    expect(result['revert term revisions in tags']?.description).toMatch(/edit the taxonomy term/);
  });

  it('aggregates permissions across multiple vocabularies', () => {
    const perms = new TaxonomyPermissions();
    const result = perms.permissions([
      new Vocabulary({ vid: 'tags', name: 'Tags' }),
      new Vocabulary({ vid: 'cats', name: 'Categories' }),
    ]);
    expect(result['create terms in tags']).toBeDefined();
    expect(result['create terms in cats']).toEqual({ title: 'Categories: Create terms' });
  });
});

describe('static permissions (port of taxonomy.permissions.yml)', () => {
  it('declares the fixed taxonomy permissions', () => {
    expect(staticPermissions['administer taxonomy']).toEqual({
      title: 'Administer vocabularies and terms',
    });
    expect(Object.keys(staticPermissions)).toContain('access taxonomy overview');
    expect(Object.keys(staticPermissions)).toContain('view vocabulary labels');
  });
});
