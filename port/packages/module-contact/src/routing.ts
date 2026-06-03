/**
 * Contact module route definitions.
 *
 * Faithful port of contact.routing.yml. Each route keeps Drupal's path, title,
 * and access requirement so a router package can register them.
 * Controller/form/handler references are kept as opaque string identifiers (as
 * in the YAML) since those classes live in other packages or are out of this
 * vertical slice's scope.
 *
 * TODO(@drupaljs/routing): replace `RouteDefinition` with the shared Route type
 * once the routing package lands; this local shape models only the fields the
 * contact routes use.
 */

export interface RouteRequirements {
  /** `_permission` — required permission machine name. */
  readonly permission?: string;
  /** `_entity_access` — entity operation requirement, e.g. "contact_form.view". */
  readonly entityAccess?: string;
  /** `_access_contact_personal_tab` — custom personal-tab access check. */
  readonly accessContactPersonalTab?: boolean;
  /** Regex/format constraints on path params, e.g. `user: \d+`. */
  readonly paramConstraints?: Readonly<Record<string, string>>;
}

export interface RouteDefinition {
  /** Route path with `{slug}` placeholders, e.g. "/contact/{contact_form}". */
  readonly path: string;
  /** `_title` static title, when present. */
  readonly title?: string;
  /** `_controller` callable identifier, when the route is controller-driven. */
  readonly controller?: string;
  /** `_entity_form` / `_entity_list` identifier, when present. */
  readonly form?: string;
  /** `_entity_list` identifier, when the route renders an entity collection. */
  readonly entityList?: string;
  /**
   * Static route defaults that are neither title/controller/form, e.g. the
   * `contact_form: NULL` default on contact.site_page.
   */
  readonly defaults?: Readonly<Record<string, unknown>>;
  /** Access requirements. */
  readonly requirements: RouteRequirements;
}

/**
 * Contact routes keyed by Drupal route name. Faithful to contact.routing.yml.
 */
export const contactRoutes: Record<string, RouteDefinition> = {
  'entity.contact_form.delete_form': {
    path: '/admin/structure/contact/manage/{contact_form}/delete',
    title: 'Delete',
    form: 'contact_form.delete',
    requirements: { entityAccess: 'contact_form.delete' },
  },
  'entity.contact_form.collection': {
    path: '/admin/structure/contact',
    title: 'Contact forms',
    entityList: 'contact_form',
    requirements: { permission: 'administer contact forms' },
  },
  'contact.form_add': {
    path: '/admin/structure/contact/add',
    title: 'Add contact form',
    form: 'contact_form.add',
    requirements: { permission: 'administer contact forms' },
  },
  'entity.contact_form.edit_form': {
    path: '/admin/structure/contact/manage/{contact_form}',
    title: 'Edit contact form',
    form: 'contact_form.edit',
    requirements: { entityAccess: 'contact_form.update' },
  },
  'contact.site_page': {
    path: '/contact',
    title: 'Contact',
    controller: '\\Drupal\\contact\\Controller\\ContactController::contactSitePage',
    defaults: { contact_form: null },
    requirements: { permission: 'access site-wide contact form' },
  },
  'entity.contact_form.canonical': {
    path: '/contact/{contact_form}',
    title: 'Contact',
    controller: '\\Drupal\\contact\\Controller\\ContactController::contactSitePage',
    requirements: { entityAccess: 'contact_form.view' },
  },
  'entity.user.contact_form': {
    path: '/user/{user}/contact',
    title: 'Contact',
    controller: '\\Drupal\\contact\\Controller\\ContactController::contactPersonalPage',
    requirements: {
      accessContactPersonalTab: true,
      paramConstraints: { user: '\\d+' },
    },
  },
};
