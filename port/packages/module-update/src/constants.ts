/**
 * Port of the status constants from `UpdateFetcherInterface` and
 * `UpdateManagerInterface`
 * (drupal-core/core/modules/update/src/UpdateFetcherInterface.php and
 * UpdateManagerInterface.php).
 *
 * These integer values are part of Drupal's release-history wire/storage
 * contract (they appear in the computed `project_data['status']`), so the exact
 * numeric values are preserved.
 */

/**
 * Fetch-level statuses, ported from `UpdateFetcherInterface` constants.
 * All are negative so they never collide with the positive
 * {@link UpdateManagerStatus} values.
 */
export const UpdateFetcherStatus = {
  /** Project's status cannot be checked. */
  NOT_CHECKED: -1,
  /** No available update data was found for project. */
  UNKNOWN: -2,
  /** There was a failure fetching available update data for this project. */
  NOT_FETCHED: -3,
  /** We need to (re)fetch available update data for this project. */
  FETCH_PENDING: -4,
} as const;

export type UpdateFetcherStatusValue =
  (typeof UpdateFetcherStatus)[keyof typeof UpdateFetcherStatus];

/**
 * Project-level statuses, ported from `UpdateManagerInterface` constants.
 */
export const UpdateManagerStatus = {
  /** Project is missing security update(s). */
  NOT_SECURE: 1,
  /** Current release has been unpublished and is no longer available. */
  REVOKED: 2,
  /** Current release is no longer supported by the project maintainer. */
  NOT_SUPPORTED: 3,
  /** Project has a new release available, but it is not a security release. */
  NOT_CURRENT: 4,
  /** Project is up to date. */
  CURRENT: 5,
} as const;

export type UpdateManagerStatusValue =
  (typeof UpdateManagerStatus)[keyof typeof UpdateManagerStatus];

/** The union of every status value a project's `status` field may hold. */
export type UpdateStatus = UpdateFetcherStatusValue | UpdateManagerStatusValue;

/**
 * Default release-history endpoint, ported from
 * `UpdateFetcher::UPDATE_DEFAULT_URL`.
 */
export const UPDATE_DEFAULT_URL = 'https://updates.drupal.org/release-history';

/** The module machine name used for all hook registrations. */
export const UPDATE_MODULE = 'update';
