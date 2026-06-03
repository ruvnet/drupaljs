/**
 * @drupaljs/module-taxonomy — TypeScript port of Drupal core's `taxonomy`
 * module (drupal-core/core/modules/taxonomy).
 *
 * Faithful, minimal vertical slice:
 *  - Entities: {@link Term} (content entity) and {@link Vocabulary} (config
 *    entity / term bundle), including lifecycle behaviour (root-parent default,
 *    orphan-child deletion) and the hierarchy constants.
 *  - Storage: {@link InMemoryTermStorage} porting TermStorage's tree walk
 *    (loadTree), parent/child relationships, and hierarchy classification.
 *  - Permissions: static (taxonomy.permissions.yml) + dynamic per-vocabulary
 *    ({@link TaxonomyPermissions}).
 *  - Routes: {@link taxonomyRoutes} (taxonomy.routing.yml).
 *  - Hooks: {@link registerTaxonomyHooks} registers hook_help via @drupaljs/hook.
 *
 * Deep dependencies (database, entity field system, full content-entity base,
 * routing/forms resolution) are stubbed with local types carrying TODO markers.
 */

// Types & contracts
export {
  HIERARCHY_DISABLED,
  HIERARCHY_SINGLE,
  HIERARCHY_MULTIPLE,
} from './types.js';
export type {
  HierarchyType,
  HookRegistrar,
  MinimalTermStorage,
  TermInterface,
  TermValues,
  VocabularyInterface,
  VocabularyValues,
} from './types.js';

// Entities
export { Term } from './entity/term.js';
export { Vocabulary } from './entity/vocabulary.js';

// Storage
export { InMemoryTermStorage } from './storage/term-storage.js';
export type { TermTreeNode } from './storage/term-storage.js';

// Permissions
export {
  TaxonomyPermissions,
  staticPermissions,
} from './permissions.js';
export type { PermissionDescriptor, PermissionSet } from './permissions.js';

// Routing
export { taxonomyRoutes } from './routing.js';
export type { RouteDefinition } from './routing.js';

// Module / hooks
export {
  registerTaxonomyHooks,
  taxonomyHelp,
  TAXONOMY_MODULE,
  TAXONOMY_TERM_ENTITY_TYPE,
  TAXONOMY_VOCABULARY_ENTITY_TYPE,
} from './module.js';
