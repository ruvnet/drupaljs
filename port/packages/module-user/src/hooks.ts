/**
 * User module hook implementations.
 *
 * Ports a representative subset of drupal-core/core/modules/user/src/Hook/
 * UserHooks.php. In Drupal these are discovered via `#[Hook]` attributes; per
 * @drupaljs/hook's design we register them explicitly through
 * {@link ModuleHandlerInterface.implement}.
 *
 * The deep collaborators the real hooks use (theme.manager, messenger, token,
 * Action config entities) are injected as a {@link UserHookServices} bag so the
 * hooks stay unit-testable and free of global service-locator coupling.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { AccountInterface, UserInterface } from './types.js';

export const USER_MODULE = 'user';

/**
 * Collaborators used by the user hooks.
 *
 * TODO(@drupaljs/theme, @drupaljs/render): replace with the real ThemeManager /
 * Messenger / Action storage contracts once those packages land.
 */
export interface UserHookServices {
  themeManager: { resetActiveTheme(): void };
  messenger: { addStatus(message: string): void };
  /** Creates the "add role" / "remove role" actions for a new role. */
  actionStorage?: { ensureRoleActions(roleId: string): void };
}

/**
 * Implements hook_user_login(): resets active theme and (if no timezone is set)
 * nudges the user to configure one. We model the timezone nudge as a status
 * message. Ports UserHooks::userLogin().
 */
export function userLogin(
  account: UserInterface,
  services: UserHookServices,
  timezone?: string | null,
): void {
  services.themeManager.resetActiveTheme();
  if (timezone === undefined || timezone === null || timezone === '') {
    services.messenger.addStatus('Configure your account time zone setting.');
  }
}

/** Implements hook_user_logout(): resets the active theme. Ports UserHooks::userLogout(). */
export function userLogout(
  _account: AccountInterface,
  services: UserHookServices,
): void {
  services.themeManager.resetActiveTheme();
}

/**
 * Implements hook_ENTITY_TYPE_insert() for user_role entities: creates the
 * add/remove-role actions for non-locked roles. Ports UserHooks::userRoleInsert().
 */
export function userRoleInsert(
  role: { id(): string },
  services: UserHookServices,
): void {
  const rid = role.id();
  if (rid === 'authenticated' || rid === 'anonymous') {
    return;
  }
  services.actionStorage?.ensureRoleActions(rid);
}

/**
 * Registers all user-module hook implementations with the module handler.
 *
 * The `services` bag is closed over by the registered callbacks so the hook
 * signatures stay aligned with Drupal's (the handler invokes them with the
 * hook's own arguments).
 */
export function registerUserHooks(
  handler: ModuleHandlerInterface,
  services: UserHookServices,
): void {
  handler.implement(USER_MODULE, 'user_login', (account: unknown, timezone?: unknown) =>
    userLogin(account as UserInterface, services, timezone as string | null | undefined),
  );
  handler.implement(USER_MODULE, 'user_logout', (account: unknown) =>
    userLogout(account as AccountInterface, services),
  );
  handler.implement(USER_MODULE, 'user_role_insert', (role: unknown) =>
    userRoleInsert(role as { id(): string }, services),
  );
}
