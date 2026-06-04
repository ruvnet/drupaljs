/**
 * Routes defined by the user module.
 *
 * Ports a representative slice of drupal-core/core/modules/user/user.routing.yml.
 * Full route compilation (regex matching, access checks) is delegated to the
 * routing package; here we model the declarative route definitions.
 *
 * TODO(@drupaljs/routing): map these onto the shared Route / RouteCollection
 * types once the routing package exposes them.
 */

export interface RouteDefinition {
  /** URL path pattern, e.g. "/user/{user}". */
  readonly path: string;
  /** Default values: controller/form/title, etc. */
  readonly defaults?: Record<string, string>;
  /** Access requirements, e.g. { _permission: 'administer users' }. */
  readonly requirements?: Record<string, string>;
}

/** User-module routes keyed by route name. */
export const USER_ROUTES: Readonly<Record<string, RouteDefinition>> =
  Object.freeze({
    'user.register': {
      path: '/user/register',
      defaults: { _entity_form: 'user.register', _title: 'Create new account' },
      requirements: { _access_user_register: 'TRUE' },
    },
    'user.logout': {
      path: '/user/logout',
      defaults: { _controller: 'UserController::logout' },
      requirements: { _user_is_logged_in: 'TRUE', _csrf_token: 'TRUE' },
    },
    'entity.user.canonical': {
      path: '/user/{user}',
      defaults: { _entity_view: 'user.full', _title_callback: 'userPageTitle' },
      requirements: { _entity_access: 'user.view' },
    },
    'entity.user.collection': {
      path: '/admin/people',
      defaults: { _entity_list: 'user', _title: 'People' },
      requirements: { _permission: 'administer users' },
    },
    'entity.user_role.collection': {
      path: '/admin/people/roles',
      defaults: { _entity_list: 'user_role', _title: 'Roles' },
      requirements: { _permission: 'administer permissions' },
    },
  });
