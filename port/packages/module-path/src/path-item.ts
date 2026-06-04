/**
 * The 'path' entity field type.
 *
 * Source: drupal-core/core/modules/path/src/Plugin/Field/FieldType/PathItem.php
 *
 * Drupal declares this with a `#[FieldType]` attribute:
 *   id: "path", default_widget: "path", no_ui: true,
 *   list_class: PathFieldItemList, constraints: ["PathAlias" => []].
 * Plugin discovery is out of scope here, so the attribute metadata is exposed
 * as the static {@link PathItem.pluginDefinition}, and the dependency on the
 * `path_alias` entity storage is passed in explicitly (rather than resolved via
 * a global service container) to keep the port testable and DI-friendly.
 */

import type {
  ContentEntityLike,
  PathAliasStorageLike,
  PathFieldValue,
} from './types.js';

/**
 * Static plugin metadata mirroring the PHP `#[FieldType]` attribute.
 */
export const PathItemPluginDefinition = {
  id: 'path',
  label: 'Path',
  description: 'An entity field containing a path alias and related data.',
  default_widget: 'path',
  no_ui: true,
  list_class: 'PathFieldItemList',
  constraints: { PathAlias: {} },
} as const;

/** The property names a `path` field item stores. */
export const PATH_ITEM_PROPERTIES = ['alias', 'pid', 'langcode'] as const;

/**
 * A single `path` field item.
 *
 * Ports the behavioural slice of `PathItem`: emptiness checks, alias trimming
 * on save, the main property name, and the create/update/delete reconciliation
 * with the `path_alias` storage performed in `postSave()`.
 */
export class PathItem {
  /** Plugin definition, mirroring the `#[FieldType]` attribute. */
  static readonly pluginDefinition = PathItemPluginDefinition;

  private value: PathFieldValue;

  constructor(value: PathFieldValue = {}) {
    this.value = { ...value };
  }

  /** The current field value. */
  getValue(): PathFieldValue {
    return this.value;
  }

  /** Sets a single property on the field value. */
  set<K extends keyof PathFieldValue>(name: K, value: PathFieldValue[K]): void {
    this.value[name] = value;
  }

  /**
   * Whether this item holds no meaningful data.
   *
   * Ports `PathItem::isEmpty()`: empty when alias, pid and langcode are all
   * null/empty-string.
   */
  isEmpty(): boolean {
    const { alias, pid, langcode } = this.value;
    return (
      (alias === undefined || alias === null || alias === '') &&
      (pid === undefined || pid === null) &&
      (langcode === undefined || langcode === null || langcode === '')
    );
  }

  /**
   * Trims surrounding whitespace from the alias before save.
   *
   * Ports `PathItem::preSave()`.
   */
  preSave(): void {
    const { alias } = this.value;
    if (alias !== undefined && alias !== null) {
      this.value.alias = alias.trim();
    }
  }

  /**
   * Creates, updates, or deletes the backing `path_alias` entity after the host
   * entity has been saved.
   *
   * Ports `PathItem::postSave()`. The PHP version resolves the alias storage and
   * runs an entity query to find an existing pid; the storage seam supplied here
   * captures the same operations explicitly.
   *
   * @param entity - The host content entity (already saved).
   * @param storage - The `path_alias` entity storage seam.
   * @param _update - Whether this was an update (kept for parity; unused).
   */
  postSave(
    entity: ContentEntityLike,
    storage: PathAliasStorageLike,
    _update: boolean,
  ): void {
    const alias = this.value.alias;
    const langcode = this.value.langcode;
    let pid = this.value.pid;

    // Explicit alias langcode wins; otherwise fall back to the entity langcode.
    const aliasLangcode =
      langcode !== undefined && langcode !== null && langcode !== ''
        ? langcode
        : entity.getLangcode();

    const systemPath = '/' + entity.getInternalPath();

    if (alias !== undefined && alias !== null && alias !== '') {
      const properties = { path: systemPath, alias, langcode: aliasLangcode };

      // Try to find an already-created alias before creating a new one.
      if (pid === undefined || pid === null) {
        const existing = storage.loadByProperties(properties);
        if (existing.length > 0 && existing[0]) {
          pid = existing[0].id();
        }
      }

      if (pid === undefined || pid === null) {
        const created = storage.create(properties);
        const newId = storage.save(created);
        this.value.pid = newId;
      } else {
        const aliasEntity = storage.load(pid);
        if (aliasEntity) {
          let changed = false;
          if (alias !== aliasEntity.getAlias()) {
            aliasEntity.setAlias(alias);
            changed = true;
          }
          if (aliasLangcode !== aliasEntity.getLangcode()) {
            aliasEntity.setLangcode(aliasLangcode);
            changed = true;
          }
          if (changed) {
            storage.save(aliasEntity);
          }
        }
      }
    } else if (pid !== undefined && pid !== null) {
      // The alias was erased: delete the stored alias entity.
      const aliasEntity = storage.load(pid);
      if (aliasEntity) {
        storage.delete([aliasEntity]);
      }
    }
  }

  /**
   * The main property name for short-hand assignment.
   *
   * Ports `PathItem::mainPropertyName()`.
   */
  static mainPropertyName(): string {
    return 'alias';
  }
}
