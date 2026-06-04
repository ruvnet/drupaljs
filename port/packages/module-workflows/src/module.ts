/**
 * Port of the workflows module's procedural surface — its `#[Hook]`-annotated
 * implementations in `src/Hook/WorkflowsHooks.php`.
 *
 * Drupal discovers hooks by scanning `#[Hook]` attributes; the TS port uses the
 * explicit registration API of the ModuleHandler (see @drupaljs/hook). Here we
 * register the `workflows` module's hooks against a {@link HookRegistrar}.
 */

import type { HookRegistrar } from './types.js';

/** The module machine name used for all hook registrations. */
export const WORKFLOWS_MODULE = 'workflows';

/** The canonical Drupal config-entity machine name for a workflow. */
export const WORKFLOW_ENTITY_TYPE = 'workflow';

/**
 * Port of `WorkflowsHooks::help()` (hook_help).
 *
 * Returns help text for the given route, or undefined when this module has no
 * help for that route. The rich HTML/markup and content_moderation link of the
 * original are condensed to the stable summary text for this slice.
 */
export function workflowsHelp(routeName: string): string | undefined {
  switch (routeName) {
    case 'help.page.workflows':
      return 'The Workflows module provides an API and an interface to create workflows with transitions between different states (for example publication or user status). These have to be provided by other modules such as the Content Moderation module.';
    default:
      return undefined;
  }
}

/**
 * Registers all workflows hook implementations against the given handler.
 *
 * Mirrors the `#[Hook(...)]`-annotated methods in `src/Hook/WorkflowsHooks.php`
 * that are in scope for this slice (currently `hook_help`).
 */
export function registerWorkflowsHooks(handler: HookRegistrar): void {
  handler.implement(WORKFLOWS_MODULE, 'help', (...args: unknown[]) => {
    const routeName = args[0] as string;
    return workflowsHelp(routeName);
  });
}
