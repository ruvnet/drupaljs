/**
 * Permissions provided by the menu_ui module.
 *
 * In Drupal 11 these are declared on the Menu config-entity type via the
 * `admin_permission` (`administer menu`) and surfaced through the permissions
 * system. Modelled here as a static map mirroring a `*.permissions.yml`.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Whether granting this permission is a security risk (restrict access). */
  restrict_access?: boolean;
}

/** Machine name of the single administer permission used across menu_ui routes. */
export const ADMINISTER_MENU = 'administer menu';

/** All permissions defined by menu_ui, keyed by machine name. */
export const MENU_UI_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ADMINISTER_MENU]: {
    title: 'Administer menus and menu links',
    restrict_access: true,
  },
};
