import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { MenuUiHooks } from './MenuUiHooks.js';
import type { EntityTypeBuildTarget, BlockPluginLike } from './MenuUiHooks.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'menu_ui';

/**
 * Registers menu_ui's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * This is the TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery
 * (see `@drupaljs/hook`): instead of scanning for attributes, the module
 * explicitly declares its implementations against the handler.
 */
export function registerMenuUiHooks(
  handler: ModuleHandlerInterface,
  hooks: MenuUiHooks = new MenuUiHooks(),
): void {
  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(
    MODULE_NAME,
    'entity_type_build',
    (entityTypes: Record<string, EntityTypeBuildTarget>) => {
      hooks.entityTypeBuild(entityTypes);
    },
  );

  handler.implement(
    MODULE_NAME,
    'block_view_system_menu_block_alter',
    (build: Record<string, unknown>, block: BlockPluginLike) => {
      hooks.blockViewSystemMenuBlockAlter(build, block);
    },
  );
}
