import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { AccountInterface } from '../contracts.js';
import { ShortcutHooks } from './ShortcutHooks.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'shortcut';

/**
 * Registers shortcut's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery (see
 * `@drupaljs/hook`): the module explicitly declares its implementations against
 * the handler. The {@link ShortcutHooks} instance carries its own collaborators
 * and is constructed by the caller.
 */
export function registerShortcutHooks(
  handler: ModuleHandlerInterface,
  hooks: ShortcutHooks,
): void {
  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(MODULE_NAME, 'toolbar', () => hooks.toolbar());

  handler.implement(MODULE_NAME, 'user_delete', (account: AccountInterface) => {
    hooks.userDelete(account);
  });
}
