/**
 * Port of the taxonomy module's procedural surface (`taxonomy.module` and
 * `src/Hook/*`): hook implementations registered through `@drupaljs/hook`.
 *
 * Drupal discovers hooks by scanning `#[Hook]` attributes; the TS port uses the
 * explicit registration API of the ModuleHandler (see @drupaljs/hook). Here we
 * register the `taxonomy` module's hooks against a {@link HookRegistrar}.
 */

import type { HookRegistrar } from './types.js';

/** Canonical Drupal entity type machine names. */
export const TAXONOMY_TERM_ENTITY_TYPE = 'taxonomy_term';
export const TAXONOMY_VOCABULARY_ENTITY_TYPE = 'taxonomy_vocabulary';

/** The module machine name used for all hook registrations. */
export const TAXONOMY_MODULE = 'taxonomy';

/**
 * Port of `TaxonomyHooks::help()` (hook_help).
 *
 * Returns help text for the given route, or undefined when this module has no
 * help for that route.
 */
export function taxonomyHelp(routeName: string): string | undefined {
  switch (routeName) {
    case 'help.page.taxonomy':
      return 'The Taxonomy module lets you classify content into categories and subcategories; it allows multiple lists of categories for classification (controlled vocabularies) and offers the possibility of creating hierarchical (nested) terms.';
    case 'entity.taxonomy_vocabulary.collection':
      return 'Taxonomy is for categorizing content. Terms are grouped into vocabularies. For example, a vocabulary called "Fruit" would contain the terms "Apple" and "Banana".';
    default:
      return undefined;
  }
}

/**
 * Registers all taxonomy hook implementations against the given handler.
 *
 * Mirrors the `#[Hook(...)]`-annotated methods in `src/Hook/TaxonomyHooks.php`
 * that are in scope for this slice (currently `hook_help`).
 */
export function registerTaxonomyHooks(handler: HookRegistrar): void {
  handler.implement(TAXONOMY_MODULE, 'help', (...args: unknown[]) => {
    const routeName = args[0] as string;
    return taxonomyHelp(routeName);
  });
}
