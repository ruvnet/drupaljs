import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { TourHooks } from './TourHooks.js';
import type { RenderArray } from '../contracts.js';

/** The module machine name under which hooks are registered. */
export const MODULE_NAME = 'tour';

/**
 * Registers tour's hook implementations with a {@link ModuleHandlerInterface}.
 *
 * TS-idiomatic equivalent of Drupal's `#[Hook]` attribute discovery: instead of
 * scanning for attributes, the module declares its implementations explicitly.
 */
export function registerTourHooks(
  handler: ModuleHandlerInterface,
  hooks: TourHooks,
): void {
  handler.implement(MODULE_NAME, 'help', (routeName: string) => hooks.help(routeName));

  handler.implement(MODULE_NAME, 'page_attachments', (page: RenderArray) => {
    hooks.pageAttachments(page);
  });
}
