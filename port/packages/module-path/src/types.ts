/**
 * Public contracts and supporting types for the `path` module port.
 *
 * Source: drupal-core/core/modules/path/*
 *
 * This module ports the user-facing "Path" module — the `path` field type, its
 * computed field-item-list, hook implementations, permissions, the `PathAlias`
 * validation constraint, and the entity routes / link templates. It depends on
 * the lower-level `path_alias` subsystem (already ported as
 * `@drupaljs/path-alias`) for actual alias storage and lookup.
 */

/**
 * Language code constant for content with no specified language.
 *
 * Mirrors `Drupal\Core\Language\LanguageInterface::LANGCODE_NOT_SPECIFIED`.
 *
 * TODO(@drupaljs/path-alias): re-export from `@drupaljs/path-alias` once the
 * monorepo wires cross-package imports; duplicated here to keep this package
 * self-contained (matching the `path_alias` package's own local-seam pattern).
 */
export const LANGCODE_NOT_SPECIFIED = 'und';

/**
 * The `path` module's permissions, keyed by machine name.
 *
 * Source: drupal-core/core/modules/path/path.permissions.yml
 */
export const PATH_PERMISSIONS = {
  'administer url aliases': { title: 'Administer URL aliases' },
  'create url aliases': { title: 'Create and edit URL aliases' },
} as const;

/** A permission machine name defined by the path module. */
export type PathPermission = keyof typeof PATH_PERMISSIONS;

// ---------------------------------------------------------------------------
// External seams (minimal). Replaced by canonical @drupaljs/* types later.
// ---------------------------------------------------------------------------

/**
 * A single stored path alias record.
 *
 * Mirrors `@drupaljs/path-alias`'s `PathAliasRecord`.
 *
 * TODO(@drupaljs/path-alias): import the canonical `PathAliasRecord` once
 * cross-package resolution is enabled.
 */
export interface PathAliasRecord {
  /** The unique alias id. */
  id: number;
  /** The internal system path, e.g. `/node/1`. */
  path: string;
  /** The public alias, e.g. `/about`. */
  alias: string;
  /** The language code the alias applies to. */
  langcode: string;
}

/** Values used to create a new path-alias entity (no id yet). */
export interface PathAliasCreateValues {
  path: string;
  alias: string;
  langcode: string;
}

/**
 * Minimal path-alias entity seam used by the field item's save/delete logic.
 *
 * Mirrors the slice of `Drupal\path_alias\Entity\PathAlias` the field touches.
 *
 * TODO(@drupaljs/path-alias): replace with the canonical PathAlias entity once
 * the entity layer lands.
 */
export interface PathAliasEntityLike {
  id(): number;
  getAlias(): string;
  setAlias(alias: string): void;
  getLangcode(): string;
  setLangcode(langcode: string): void;
}

/**
 * Minimal storage seam for the `path_alias` entity type.
 *
 * Mirrors the slice of `Drupal\Core\Entity\EntityStorageInterface` (plus the
 * query) that {@link PathItem.postSave} / {@link PathFieldItemList.delete} use.
 *
 * TODO(@drupaljs/entity): replace with the canonical EntityStorageInterface.
 */
export interface PathAliasStorageLike {
  /** Loads an alias entity by id, or `null` if it does not exist. */
  load(pid: number): PathAliasEntityLike | null;
  /** Creates (but does not persist) a new alias entity. */
  create(values: PathAliasCreateValues): PathAliasEntityLike;
  /** Persists the entity, returning its (possibly newly assigned) id. */
  save(entity: PathAliasEntityLike): number;
  /** Deletes the given entities. */
  delete(entities: PathAliasEntityLike[]): void;
  /** Finds existing alias entities matching every supplied property. */
  loadByProperties(
    properties: Partial<PathAliasCreateValues>,
  ): PathAliasEntityLike[];
}

/**
 * The alias-repository lookup seam used by the computed field list.
 *
 * Mirrors the single method of `@drupaljs/path-alias`'s
 * `AliasRepositoryInterface` that the `path` field reads.
 *
 * TODO(@drupaljs/path-alias): import the canonical `AliasRepositoryInterface`.
 */
export interface AliasRepositoryLike {
  lookupBySystemPath(path: string, langcode: string): PathAliasRecord | null;
}

/**
 * Minimal content-entity seam the path field operates against.
 *
 * Mirrors the slice of `Drupal\Core\Entity\ContentEntityInterface` used here.
 *
 * TODO(@drupaljs/entity): replace with the canonical ContentEntityInterface.
 */
export interface ContentEntityLike {
  /** True for an entity that has not yet been saved. */
  isNew(): boolean;
  /** The internal system path without leading slash, e.g. `node/1`. */
  getInternalPath(): string;
  /** The entity's own langcode (used as the default alias langcode). */
  getLangcode(): string;
  /** True when this is the default (non-pending) revision. */
  isDefaultRevision(): boolean;
  /** True when this is the default translation. */
  isDefaultTranslation(): boolean;
}

/** A `path` field's stored value (alias + bookkeeping). */
export interface PathFieldValue {
  /** The alias text, e.g. `/about`. Empty/undefined means "no alias". */
  alias?: string | undefined;
  /** The alias entity id, once persisted. */
  pid?: number | undefined;
  /** The alias langcode; falls back to the entity langcode when empty. */
  langcode?: string | undefined;
}

/**
 * Minimal module-handler registration seam.
 *
 * Mirrors the single method of `@drupaljs/hook`'s `ModuleHandlerInterface`
 * needed to register this module's hook implementations.
 *
 * TODO(@drupaljs/hook): import `ModuleHandlerInterface` once cross-package
 * resolution is enabled; this captures only the `implement` surface.
 */
export interface HookRegistrarLike {
  implement(
    module: string,
    hook: string,
    callback: (...args: any[]) => unknown,
  ): void;
}
