/**
 * Permissions provided by the tour module.
 *
 * Mirrors `tour.permissions.yml`. Modelled as a static map equivalent to a
 * `*.permissions.yml` file.
 */

export interface PermissionDefinition {
  /** Human-readable title. */
  title: string;
  /** Optional longer description. */
  description?: string;
  /** Whether granting this permission is a security risk (restrict access). */
  restrict_access?: boolean;
}

/** Machine name of the single permission gating tours. */
export const ACCESS_TOUR = 'access tour';

/** All permissions defined by tour, keyed by machine name. */
export const TOUR_PERMISSIONS: Readonly<Record<string, PermissionDefinition>> = {
  [ACCESS_TOUR]: {
    title: 'Access tour',
    description: 'View tour tips.',
  },
};
