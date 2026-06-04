/**
 * Permissions provided by the views_ui module.
 *
 * Ports `views_ui.permissions.yml`. Modelled as a static map mirroring a
 * `*.permissions.yml` file.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Whether granting this permission is a security risk (restrict access). */
  restrict_access?: boolean;
}

/** Machine name of the administer permission used across views_ui routes. */
export const ADMINISTER_VIEWS = 'administer views';

/** All permissions defined by views_ui, keyed by machine name. */
export const VIEWS_UI_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ADMINISTER_VIEWS]: {
    title: 'Administer views',
    restrict_access: true,
  },
};
