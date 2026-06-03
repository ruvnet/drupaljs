/**
 * @drupaljs/module-user — TypeScript port of Drupal core's `user` module.
 *
 * Faithful, minimal vertical slice of drupal-core/core/modules/user:
 *  - {@link Role} / {@link User} entities (config + content)
 *  - {@link PermissionChecker} service (role-permission aggregation)
 *  - {@link PermissionHandler} + {@link USER_PERMISSIONS} (defined permissions)
 *  - hook implementations registered via @drupaljs/hook ({@link registerUserHooks})
 *  - {@link USER_ROUTES} route definitions
 *
 * Deep external collaborators (theme manager, messenger, config-entity storage,
 * routing/access compilation) are stubbed with local types marked TODO.
 */

// Contracts & constants
export {
  ANONYMOUS_ROLE,
  AUTHENTICATED_ROLE,
  USERNAME_MAX_LENGTH,
  ANONYMOUS_UID,
  type AccountInterface,
  type PermissionCheckerInterface,
  type RoleProviderInterface,
  type RoleInterface,
  type UserInterface,
} from './types.js';

// Entities
export { Role, type RoleValues } from './entity/role.js';
export { User, type UserValues } from './entity/user.js';

// Services
export {
  PermissionChecker,
  InMemoryRoleProvider,
} from './permission-checker.js';

// Permissions
export {
  PermissionHandler,
  USER_PERMISSIONS,
  type PermissionDefinition,
} from './permissions.js';

// Routes
export { USER_ROUTES, type RouteDefinition } from './routes.js';

// Hooks
export {
  USER_MODULE,
  registerUserHooks,
  userLogin,
  userLogout,
  userRoleInsert,
  type UserHookServices,
} from './hooks.js';
