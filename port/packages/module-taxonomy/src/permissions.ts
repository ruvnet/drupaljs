/**
 * Port of taxonomy permissions:
 *  - static permissions from `taxonomy.permissions.yml`
 *  - dynamic per-vocabulary permissions from
 *    `Drupal\taxonomy\TaxonomyPermissions::permissions()`.
 */

import type { VocabularyInterface } from './types.js';

/** A single permission descriptor (title + optional description). */
export interface PermissionDescriptor {
  readonly title: string;
  readonly description?: string;
}

export type PermissionSet = Record<string, PermissionDescriptor>;

/** Static permissions declared in taxonomy.permissions.yml. */
export const staticPermissions: PermissionSet = {
  'administer taxonomy': { title: 'Administer vocabularies and terms' },
  'access taxonomy overview': {
    title: 'Access the taxonomy vocabulary overview page',
    description: 'Get an overview of all taxonomy vocabularies.',
  },
  'revert all taxonomy revisions': { title: 'Revert all term revisions' },
  'delete all taxonomy revisions': { title: 'Delete all term revisions' },
  'view all taxonomy revisions': { title: 'View all term revisions' },
  'view vocabulary labels': { title: 'View vocabulary labels' },
};

/**
 * Port of `Drupal\taxonomy\TaxonomyPermissions`.
 *
 * Generates the six per-vocabulary term permissions. Upstream loads all
 * vocabularies via the entity type manager; here they are passed in (dependency
 * inversion — the caller supplies the loaded vocabularies).
 */
export class TaxonomyPermissions {
  /** Get the dynamic per-vocabulary taxonomy permissions. */
  permissions(vocabularies: VocabularyInterface[]): PermissionSet {
    const result: PermissionSet = {};
    for (const vocabulary of vocabularies) {
      Object.assign(result, this.buildPermissions(vocabulary));
    }
    return result;
  }

  /** Builds the standard list of term permissions for one vocabulary. */
  private buildPermissions(vocabulary: VocabularyInterface): PermissionSet {
    const id = vocabulary.id();
    const label = vocabulary.label();
    return {
      [`create terms in ${id}`]: { title: `${label}: Create terms` },
      [`delete terms in ${id}`]: { title: `${label}: Delete terms` },
      [`edit terms in ${id}`]: { title: `${label}: Edit terms` },
      [`view term revisions in ${id}`]: { title: `${label}: View term revisions` },
      [`revert term revisions in ${id}`]: {
        title: `${label}: Revert term revisions`,
        description: 'To revert a revision you also need permission to edit the taxonomy term.',
      },
      [`delete term revisions in ${id}`]: {
        title: `${label}: Delete term revisions`,
        description: 'To delete a revision you also need permission to delete the taxonomy term.',
      },
    };
  }
}
