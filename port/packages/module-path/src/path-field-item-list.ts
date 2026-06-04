/**
 * The computed field-item-list for the 'path' field type.
 *
 * Source:
 * drupal-core/core/modules/path/src/Plugin/Field/FieldType/PathFieldItemList.php
 *
 * In Drupal this uses `ComputedItemListTrait`: the alias value is looked up
 * lazily from `path_alias.repository`. The access rule and the delete sweep are
 * ported alongside it. Service dependencies (alias repository, alias storage)
 * are injected explicitly rather than pulled from a global container.
 */

import { LANGCODE_NOT_SPECIFIED } from './types.js';
import type {
  AliasRepositoryLike,
  ContentEntityLike,
  PathAliasStorageLike,
  PathFieldValue,
} from './types.js';

/**
 * Default field access for a `path` field item list.
 *
 * Ports `PathFieldItemList::defaultAccess()`: `view` is always allowed; any
 * other operation requires `create url aliases` OR `administer url aliases`.
 *
 * @param operation - The operation, e.g. `view`, `update`.
 * @param accountPermissions - Permission machine names the account holds.
 */
export function hasPathFieldAccess(
  operation: string,
  accountPermissions: readonly string[],
): boolean {
  if (operation === 'view') {
    return true;
  }
  return (
    accountPermissions.includes('create url aliases') ||
    accountPermissions.includes('administer url aliases')
  );
}

/**
 * Computed list of `path` field items for a single entity.
 */
export class PathFieldItemList {
  constructor(
    private readonly entity: ContentEntityLike,
    private readonly langcode: string,
    private readonly aliasRepository: AliasRepositoryLike,
  ) {}

  /**
   * Computes the field value: the stored alias (if any) plus its bookkeeping,
   * otherwise just the current langcode.
   *
   * Ports `PathFieldItemList::computeValue()`.
   */
  computeValue(): PathFieldValue {
    // Default to the current language for new entities / entities without an
    // alias.
    let value: PathFieldValue = { langcode: this.langcode };

    if (!this.entity.isNew()) {
      const systemPath = '/' + this.entity.getInternalPath();
      const record = this.aliasRepository.lookupBySystemPath(
        systemPath,
        this.langcode,
      );
      if (record) {
        value = {
          alias: record.alias,
          pid: record.id,
          langcode: record.langcode,
        };
      }
    }

    return value;
  }

  /**
   * Deletes all aliases associated with the host entity.
   *
   * Ports `PathFieldItemList::delete()`. The default translation also sweeps
   * language-neutral (`und`) aliases.
   *
   * @param storage - The `path_alias` entity storage seam.
   */
  delete(storage: PathAliasStorageLike): void {
    const systemPath = '/' + this.entity.getInternalPath();
    const langcodes = [this.langcode];
    if (this.entity.isDefaultTranslation()) {
      langcodes.push(LANGCODE_NOT_SPECIFIED);
    }

    const toDelete = [];
    for (const langcode of langcodes) {
      toDelete.push(
        ...storage.loadByProperties({ path: systemPath, langcode }),
      );
    }
    storage.delete(toDelete);
  }
}
