/**
 * Help module permissions — TypeScript port of
 * `core/modules/help/help.permissions.yml`.
 *
 * Drupal expresses permissions as a YAML map keyed by permission id, with a
 * `title` and optional `description` / `restrict access`. The help module
 * defines a single permission. We reuse the same shape as
 * `@drupaljs/module-system` (snake_case `restrict_access` for the YAML
 * `restrict access` key).
 */

/**
 * A permission definition.
 *
 * TODO(@drupaljs/user): when the user/permission-handler package lands, replace
 * this local type with the shared permission descriptor it exports.
 */
export interface Permission {
  /** Human-readable permission title. */
  readonly title: string;
  /** Optional admin-facing description. */
  readonly description?: string;
  /** Drupal's `restrict access`: flags security-sensitive permissions. */
  readonly restrict_access?: true;
}

/**
 * The static permission set provided by the help module.
 *
 * Faithful to `help.permissions.yml`:
 *
 *     access help pages:
 *       title: 'Use help pages'
 */
export const helpPermissions: Readonly<Record<string, Permission>> = {
  'access help pages': { title: 'Use help pages' },
};
