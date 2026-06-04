/**
 * Permissions provided by the contextual module.
 *
 * Mirrors `contextual.permissions.yml`. Modelled as a static map equivalent to
 * a `*.permissions.yml` file.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Whether granting this permission is a security risk (restrict access). */
  restrict_access?: boolean;
}

/** Machine name of the single permission gating contextual links. */
export const ACCESS_CONTEXTUAL_LINKS = 'access contextual links';

/** All permissions defined by contextual, keyed by machine name. */
export const CONTEXTUAL_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ACCESS_CONTEXTUAL_LINKS]: {
    title: 'Use contextual links',
  },
};
