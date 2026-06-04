import { accessNeutral, type AccessResult } from './contracts.js';
import type { ShortcutInterface } from './Entity/interfaces.js';
import type { ShortcutAccess } from './ShortcutAccess.js';
import type { ShortcutSetStorageInterface } from './ShortcutSetStorage.js';

/**
 * Access control handler for the `shortcut` entity type.
 *
 * Ports `Drupal\shortcut\ShortcutAccessControlHandler`: a shortcut's access is
 * the edit-access of its owning shortcut set (resolved via {@link ShortcutAccess}).
 */
export class ShortcutAccessControlHandler {
  constructor(
    private readonly shortcutSetStorage: ShortcutSetStorageInterface,
    private readonly shortcutAccess: ShortcutAccess,
  ) {}

  /** Access for an existing shortcut, keyed off its bundle's set-edit access. */
  checkAccess(entity: ShortcutInterface): AccessResult {
    const shortcutSet = this.shortcutSetStorage.load(entity.bundle());
    if (shortcutSet) {
      return this.shortcutAccess.setEditAccess(shortcutSet);
    }
    return accessNeutral();
  }

  /** Create access, keyed off the target bundle's set-edit access. */
  checkCreateAccess(entityBundle: string): AccessResult {
    const shortcutSet = this.shortcutSetStorage.load(entityBundle);
    if (shortcutSet) {
      return this.shortcutAccess.setEditAccess(shortcutSet);
    }
    return accessNeutral();
  }
}
