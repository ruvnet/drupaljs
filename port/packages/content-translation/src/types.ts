/**
 * Minimal LOCAL contracts for collaborators this package depends on.
 *
 * TODO(@drupaljs/entity, @drupaljs/language, @drupaljs/access): these stand-ins
 * mirror just the slice of the Drupal interfaces that content-translation
 * touches. Replace with the canonical types once those packages publish them.
 *
 * Source: drupal-core/core/lib/Drupal/Core/Entity/*,
 *         drupal-core/core/lib/Drupal/Core/Language/*,
 *         drupal-core/core/lib/Drupal/Core/Access/*
 */

/** Result of an access check. Mirrors `AccessResultInterface`. */
export interface AccessResultInterface {
  isAllowed(): boolean;
  isForbidden(): boolean;
  isNeutral(): boolean;
}

/** A single field item with a scalar `value`, plus an optional referenced entity. */
export interface FieldItem {
  value: unknown;
  /** The referenced entity, for entity-reference fields (e.g. author uid). */
  entity?: unknown;
}

/** Minimal field definition surface. Mirrors `FieldDefinitionInterface`. */
export interface FieldDefinitionInterface {
  isTranslatable(): boolean;
}

/** Describes the type of an entity. Mirrors `EntityTypeInterface` (subset). */
export interface EntityTypeInterface {
  id(): string;
  isTranslatable(): boolean;
  hasLinkTemplate(template: string): boolean;
  /** Arbitrary annotation lookup, e.g. `content_translation_metadata`. */
  get(key: string): unknown;
}

/**
 * A fieldable, translatable content entity. Mirrors the union of
 * `ContentEntityInterface` + `TranslatableInterface` that the metadata wrapper
 * and manager rely on.
 */
export interface ContentEntityInterface {
  getEntityType(): EntityTypeInterface;
  hasField(name: string): boolean;
  get(name: string): FieldItem;
  set(name: string, value: unknown): this;
  getFieldDefinition(name: string): FieldDefinitionInterface;
  /** Owner fallback when no dedicated translation-author field exists. */
  getOwner?(): unknown;
  /** Entity changed-time fallback when no translation-changed field exists. */
  getChangedTime?(): number;
}

/** The translation handler resolved per entity type. */
export interface ContentTranslationHandlerInterface {
  /** Returns the per-translation metadata field names this handler manages. */
  getFieldDefinitions?(): Record<string, unknown>;
}

/** Loads/creates config entities (here: `language_content_settings`). */
export interface ConfigEntityStorageInterface {
  load(id: string): ContentLanguageSettingsInterface | null;
  create(values: Record<string, unknown>): ContentLanguageSettingsInterface;
}

/** Language descriptor surface used by access checks. */
export interface LanguageInterface {
  isLocked(): boolean;
}

/**
 * The richer entity surface the access check relies on (op-level access,
 * untranslated handle, translatability). Mirrors `ContentEntityInterface`.
 */
export interface AccessibleTranslatableEntity {
  access(operation: string): boolean;
  getUntranslated(): { language(): LanguageInterface };
  isTranslatable(): boolean;
}

/** Resolves handlers, definitions and storage by entity type id. */
export interface EntityTypeManagerInterface {
  getDefinition(entityTypeId: string): EntityTypeInterface;
  getDefinitions(): Record<string, EntityTypeInterface>;
  getHandler(
    entityTypeId: string,
    handlerType: string,
  ): ContentTranslationHandlerInterface;
  getStorage(entityTypeId: string): ConfigEntityStorageInterface;
}

/** Provides bundle info for an entity type. Mirrors `EntityTypeBundleInfoInterface`. */
export interface EntityTypeBundleInfoInterface {
  getBundleInfo(entityTypeId: string): Record<string, unknown>;
}

/** Per-bundle language settings config. Mirrors `ContentLanguageSettings`. */
export interface ContentLanguageSettingsInterface {
  getThirdPartySetting<T>(module: string, key: string, defaultValue: T): T;
  setThirdPartySetting(module: string, key: string, value: unknown): this;
  save(): void;
}

/** Reports the multilingual state of the site. Mirrors `LanguageManagerInterface` (subset). */
export interface LanguageManagerInterface {
  isMultilingual(): boolean;
}

/** The acting user. Mirrors `AccountProxyInterface` (subset). */
export interface AccountInterface {
  hasPermission(permission: string): boolean;
}
