import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { ViewsUiHooks } from './ViewsUiHooks.js';
import type {
  DisplayPluginDefinition,
  EntityTypeBuildTarget,
  ViewAccessChecker,
} from './ViewsUiHooks.js';
import type { BlockEntityLike } from '../contracts.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'views_ui';

/**
 * Registers views_ui's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * The TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery
 * (see `@drupaljs/hook`): the module explicitly declares its implementations
 * against the handler rather than scanning for attributes.
 */
export function registerViewsUiHooks(
  handler: ModuleHandlerInterface,
  hooks: ViewsUiHooks = new ViewsUiHooks(),
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
    'views_plugins_display_alter',
    (plugins: Record<string, DisplayPluginDefinition>) => {
      hooks.viewsPluginsDisplayAlter(plugins);
    },
  );

  handler.implement(
    MODULE_NAME,
    'entity_operation',
    (block: BlockEntityLike, access: ViewAccessChecker) => hooks.entityOperation(block, access),
  );
}
