/**
 * @drupaljs/module-path — TypeScript port of Drupal Core's `path` module.
 *
 * Source: drupal-core/core/modules/path/*
 *
 * The `path` module lets users define custom URLs (aliases) for existing
 * internal paths. This package ports its user-facing surface; the underlying
 * alias storage/lookup lives in the `path_alias` subsystem (`@drupaljs/path-alias`).
 *
 * Public surface:
 * - **Field type**: `PathItem` (the `path` field) + `PathFieldItemList`
 *   (computed list, access rule via `hasPathFieldAccess`, alias delete sweep).
 * - **Validation**: `PathAliasConstraint` + `validatePathAlias` (forbids
 *   changing an alias in a pending revision).
 * - **Hooks**: `registerPathHooks` (registers `help`, `entity_type_alter`,
 *   `entity_base_field_info`, `entity_translation_create` via `@drupaljs/hook`),
 *   plus the individual hook functions and the admin link templates.
 * - **Permissions**: `PATH_PERMISSIONS` (`administer url aliases`,
 *   `create url aliases`).
 * - **Seam types**: minimal `path_alias` storage / repository / entity contracts
 *   carrying TODO markers until the canonical `@drupaljs/*` packages land.
 */

export {
  LANGCODE_NOT_SPECIFIED,
  PATH_PERMISSIONS,
  type PathPermission,
  type PathAliasRecord,
  type PathAliasCreateValues,
  type PathAliasEntityLike,
  type PathAliasStorageLike,
  type AliasRepositoryLike,
  type ContentEntityLike,
  type PathFieldValue,
  type HookRegistrarLike,
} from './types.js';

export {
  PathItem,
  PathItemPluginDefinition,
  PATH_ITEM_PROPERTIES,
} from './path-item.js';

export {
  PathFieldItemList,
  hasPathFieldAccess,
} from './path-field-item-list.js';

export {
  PathAliasConstraint,
  validatePathAlias,
  type PathAliasConstraintOptions,
  type PathAliasValidationSubject,
  type PathAliasValidationOriginal,
} from './path-alias-constraint.js';

export {
  PATH_MODULE_NAME,
  PATH_FIELD_ENTITY_TYPES,
  PATH_ALIAS_LINK_TEMPLATES,
  registerPathHooks,
  pathHelp,
  pathEntityTypeAlter,
  pathEntityBaseFieldInfo,
  pathEntityTranslationCreate,
  type BaseFieldDefinitionLike,
  type EntityTypeAlterTarget,
} from './hooks.js';
