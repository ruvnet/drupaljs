import {
  accessAllowed,
  accessAllowedIf,
  accessNeutral,
  type AccessResult,
  type AccountInterface,
} from './contracts.js';
import {
  ACCESS_SHORTCUTS,
  ADMINISTER_SHORTCUTS,
  CUSTOMIZE_SHORTCUT_LINKS,
  SWITCH_SHORTCUT_SETS,
} from './permissions.js';
import type { ShortcutSetInterface } from './Entity/interfaces.js';
import type { ShortcutSetStorageInterface } from './ShortcutSetStorage.js';

const NOT_DISPLAYED_REASON =
  "The shortcut set must be the currently displayed set for the user and the user must have 'access shortcuts' AND 'customize shortcut links' permissions.";

/**
 * Access callbacks for the shortcut module.
 *
 * Ports the procedural `shortcut_set_edit_access()` and
 * `shortcut_set_switch_access()` helpers from `shortcut.module` into an
 * injectable service so they are unit-testable. The current-user accessor is a
 * factory (matching `\Drupal::currentUser()` being resolved per call).
 */
export class ShortcutAccess {
  constructor(
    private readonly shortcutSetStorage: ShortcutSetStorageInterface,
    private readonly currentUser: () => AccountInterface,
  ) {}

  /**
   * Access for editing a shortcut set. Administrators may edit any set; users
   * with `customize shortcut links` + `access shortcuts` may edit only their
   * currently displayed set.
   */
  setEditAccess(shortcutSet?: ShortcutSetInterface): AccessResult {
    const account = this.currentUser();

    if (account.hasPermission(ADMINISTER_SHORTCUTS)) {
      return accessAllowed();
    }

    let mayEdit =
      account.hasPermission(CUSTOMIZE_SHORTCUT_LINKS) && account.hasPermission(ACCESS_SHORTCUTS);

    if (mayEdit && shortcutSet) {
      const displayed = this.shortcutSetStorage.getDisplayedToUser(account);
      mayEdit = shortcutSet.id() === displayed.id();
    }

    return accessAllowedIf(mayEdit, mayEdit ? undefined : NOT_DISPLAYED_REASON);
  }

  /**
   * Access for switching the shortcut set assigned to a user. Administrators may
   * switch anyone; other users may switch only their own set, and only with
   * `access shortcuts` + `switch shortcut sets`.
   */
  setSwitchAccess(account?: AccountInterface): AccessResult {
    const user = this.currentUser();

    if (user.hasPermission(ADMINISTER_SHORTCUTS)) {
      return accessAllowed();
    }
    if (!user.hasPermission(ACCESS_SHORTCUTS)) {
      return accessNeutral();
    }
    if (!user.hasPermission(SWITCH_SHORTCUT_SETS)) {
      return accessNeutral();
    }
    if (!account) {
      return accessAllowed();
    }
    if (user.id() === account.id()) {
      return accessAllowed();
    }
    return accessNeutral();
  }
}
