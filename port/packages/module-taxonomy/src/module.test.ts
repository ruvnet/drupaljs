import { describe, it, expect, vi } from 'vitest';
import { registerTaxonomyHooks, taxonomyHelp, TAXONOMY_TERM_ENTITY_TYPE, TAXONOMY_VOCABULARY_ENTITY_TYPE } from './module.js';
import { taxonomyRoutes } from './routing.js';
import type { HookRegistrar } from './types.js';

describe('taxonomy module hook registration (@drupaljs/hook)', () => {
  it('registers help + entity hooks under the "taxonomy" module', () => {
    const calls: Array<[string, string]> = [];
    const registrar: HookRegistrar = {
      implement: vi.fn((module: string, hook: string) => {
        calls.push([module, hook]);
      }),
    };
    registerTaxonomyHooks(registrar);
    expect(registrar.implement).toHaveBeenCalled();
    // Every registration is for the taxonomy module.
    expect(calls.every(([m]) => m === 'taxonomy')).toBe(true);
    const hooks = calls.map(([, h]) => h);
    expect(hooks).toContain('help');
  });

  it('help hook returns guidance for the taxonomy overview route', () => {
    const help = taxonomyHelp('help.page.taxonomy');
    expect(help).toMatch(/taxonomy/i);
    expect(taxonomyHelp('some.other.route')).toBeUndefined();
  });
});

describe('taxonomy entity type ids', () => {
  it('exports the canonical Drupal machine names', () => {
    expect(TAXONOMY_TERM_ENTITY_TYPE).toBe('taxonomy_term');
    expect(TAXONOMY_VOCABULARY_ENTITY_TYPE).toBe('taxonomy_vocabulary');
  });
});

describe('taxonomy routes (port of taxonomy.routing.yml)', () => {
  it('defines the canonical term route with an integer requirement', () => {
    const canonical = taxonomyRoutes['entity.taxonomy_term.canonical'];
    expect(canonical?.path).toBe('/taxonomy/term/{taxonomy_term}');
    expect(canonical?.requirements?.taxonomy_term).toBe('\\d+');
  });

  it('defines add/edit/delete term routes', () => {
    expect(taxonomyRoutes['entity.taxonomy_term.add_form']?.path).toBe(
      '/admin/structure/taxonomy/manage/{taxonomy_vocabulary}/add',
    );
    expect(taxonomyRoutes['entity.taxonomy_term.edit_form']?.path).toBe('/taxonomy/term/{taxonomy_term}/edit');
    expect(taxonomyRoutes['entity.taxonomy_term.delete_form']?.path).toBe('/taxonomy/term/{taxonomy_term}/delete');
  });
});
