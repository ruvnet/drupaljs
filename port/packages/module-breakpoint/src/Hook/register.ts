import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { BreakpointHooks } from './BreakpointHooks.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'breakpoint';

/**
 * Registers breakpoint's hook implementations with a
 * {@link ModuleHandlerInterface}.
 *
 * The TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery (see
 * `@drupaljs/hook`): instead of scanning for attributes, the module explicitly
 * declares its implementations against the handler.
 */
export function registerBreakpointHooks(
  handler: ModuleHandlerInterface,
  hooks: BreakpointHooks,
): void {
  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(MODULE_NAME, 'themes_installed', (themeList: string[]) => {
    hooks.themesInstalled(themeList);
  });

  handler.implement(MODULE_NAME, 'themes_uninstalled', (themeList: string[]) => {
    hooks.themesUninstalled(themeList);
  });
}
