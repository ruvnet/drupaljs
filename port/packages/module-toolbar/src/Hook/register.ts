import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { RenderArray } from '../contracts.js';
import { ToolbarHooks } from './ToolbarHooks.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'toolbar';

/**
 * Registers toolbar's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery (see
 * `@drupaljs/hook`): the module explicitly declares its implementations against
 * the handler instead of being scanned.
 *
 * The `ToolbarHooks` instance carries its own collaborators (current user,
 * module handler, subtrees-hash provider), so it must be constructed by the
 * caller and passed in.
 */
export function registerToolbarHooks(handler: ModuleHandlerInterface, hooks: ToolbarHooks): void {
  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(MODULE_NAME, 'page_top', (pageTop: RenderArray) => {
    hooks.pageTop(pageTop);
  });

  handler.implement(MODULE_NAME, 'toolbar', () => hooks.toolbar());
}
