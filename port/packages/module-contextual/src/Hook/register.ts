import type { ModuleHandlerInterface } from '@drupaljs/hook';
import { ContextualHooks } from './ContextualHooks.js';
import type { RenderArray } from '../contracts.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'contextual';

/**
 * Registers contextual's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery: instead of
 * scanning for attributes, the module declares its implementations explicitly.
 */
export function registerContextualHooks(
  handler: ModuleHandlerInterface,
  hooks: ContextualHooks,
): void {
  handler.implement(MODULE_NAME, 'toolbar', () => hooks.toolbar());

  handler.implement(MODULE_NAME, 'page_attachments', (page: RenderArray) => {
    hooks.pageAttachments(page);
  });

  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(
    MODULE_NAME,
    'contextual_links_view_alter',
    (element: RenderArray, items: unknown) => {
      hooks.contextualLinksViewAlter(element, items);
    },
  );
}
