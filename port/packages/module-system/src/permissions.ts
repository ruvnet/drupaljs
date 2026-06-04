/**
 * System module permissions — TypeScript port of
 * `core/modules/system/system.permissions.yml`.
 *
 * Drupal expresses permissions as a YAML map keyed by permission id, with
 * `title`, optional `description`, and optional `restrict access` (a security
 * flag for permissions that should warn the admin). We model the same shape;
 * the YAML `restrict access` key is rendered as `restrict_access` (TS-idiomatic
 * snake_case identifier, no space).
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
 * The static permission set provided by the system module.
 *
 * Note (faithful to the source comment): the `access content` permission is
 * moved into the Node section of the permissions form when the Node module is
 * enabled — that is a UI grouping concern, so the permission is still defined
 * here by the system module.
 */
export const systemPermissions: Readonly<Record<string, Permission>> = {
  'administer modules': { title: 'Administer modules' },
  'administer site configuration': {
    title: 'Administer site configuration',
    restrict_access: true,
  },
  'administer themes': { title: 'Administer themes', restrict_access: true },
  'administer software updates': {
    title: 'Administer software updates',
    restrict_access: true,
  },
  'access administration pages': { title: 'Use the administration pages' },
  'access site in maintenance mode': { title: 'Use the site in maintenance mode' },
  'view the administration theme': {
    title: 'View the administration theme',
    description:
      'This is only used when the site is configured to use a separate administration theme on the Appearance page.',
  },
  'access content': { title: 'View published content' },
  'access site reports': { title: 'View site reports', restrict_access: true },
  'link to any page': {
    title: 'Link to any page',
    restrict_access: true,
    description: 'This allows to bypass access checking when linking to internal paths.',
  },
  'administer menu': { title: 'Administer menus and menu links' },
  'administer actions': { title: 'Administer actions', restrict_access: true },
};
