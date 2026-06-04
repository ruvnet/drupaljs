/**
 * Contact module permission definitions.
 *
 * Faithful port of contact.permissions.yml. In Drupal these are discovered from
 * YAML and surfaced through the permission handler; here they are an explicit,
 * typed table the access handlers and any permission UI can consume.
 */

export interface PermissionDefinition {
  /** Human-readable permission title. */
  readonly title: string;
  /**
   * When true the permission is "restricted" — granting it has security
   * implications and the UI warns the administrator. Ports `restrict access`.
   */
  readonly restrictAccess?: boolean;
}

/** Permission machine names provided by the contact module. */
export const ContactPermission = {
  AdministerContactForms: 'administer contact forms',
  AccessSiteWideContactForm: 'access site-wide contact form',
  AccessUserContactForms: 'access user contact forms',
} as const;

export type ContactPermissionName =
  (typeof ContactPermission)[keyof typeof ContactPermission];

/**
 * The full permission map, keyed by machine name. Mirrors the YAML exactly.
 */
export const contactPermissions: Record<ContactPermissionName, PermissionDefinition> = {
  [ContactPermission.AdministerContactForms]: {
    title: 'Administer contact forms and contact form settings',
  },
  [ContactPermission.AccessSiteWideContactForm]: {
    title: 'Use the site-wide contact form',
  },
  [ContactPermission.AccessUserContactForms]: {
    title: "Use users' personal contact forms",
  },
};
