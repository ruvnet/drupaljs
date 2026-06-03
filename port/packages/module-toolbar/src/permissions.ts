/**
 * Permissions provided by the toolbar module.
 *
 * Ports `toolbar.permissions.yml`, which declares the single `access toolbar`
 * permission. Modelled as a static map mirroring the YAML.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Whether granting this permission is a security risk (restrict access). */
  restrict_access?: boolean;
}

/** Machine name of the permission gating toolbar visibility/access. */
export const ACCESS_TOOLBAR = 'access toolbar';

/** All permissions defined by toolbar, keyed by machine name. */
export const TOOLBAR_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ACCESS_TOOLBAR]: {
    title: 'Use the toolbar',
  },
};
