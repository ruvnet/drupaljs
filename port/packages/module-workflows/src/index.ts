/**
 * @drupaljs/module-workflows — TypeScript port of Drupal core's `workflows`
 * module (drupal-core/core/modules/workflows).
 *
 * Faithful, minimal vertical slice:
 *  - Value objects: {@link State} (State.php) and {@link Transition}
 *    (Transition.php) — immutable, delegating graph queries to the workflow type.
 *  - Plugin base: {@link WorkflowTypeBase} (Plugin/WorkflowTypeBase.php) — the
 *    configurable state/transition machine that is the core of the module, plus a
 *    concrete {@link TestWorkflowType} for exercising it.
 *  - Entity: {@link Workflow} (Entity/Workflow.php) — the `workflow` config
 *    entity with lazy type-plugin instantiation and required-state enforcement.
 *  - Exception: {@link RequiredStateMissingException}.
 *  - Permissions: {@link workflowsPermissions} (workflows.permissions.yml).
 *  - Routes: {@link workflowsRoutes} (workflows.routing.yml).
 *  - Hooks: {@link registerWorkflowsHooks} registers hook_help via @drupaljs/hook.
 *
 * Deep dependencies (config entity base, the plugin-manager DI container,
 * routing/forms resolution, access/cache subsystems) are stubbed with local
 * types carrying TODO markers.
 */

// Contracts & constants
export {
  DIRECTION_FROM,
  DIRECTION_TO,
} from './types.js';
export type {
  HookRegistrar,
  StateConfig,
  StateInterface,
  TransitionConfig,
  TransitionDirection,
  TransitionInterface,
  WorkflowInterface,
  WorkflowTypeConfiguration,
  WorkflowTypeDefinition,
  WorkflowTypeInterface,
} from './types.js';

// Value objects
export { State } from './state.js';
export { Transition } from './transition.js';

// Plugin (state/transition machine)
export { WorkflowTypeBase } from './plugin/workflow-type-base.js';
export { TestWorkflowType } from './plugin/test-workflow-type.js';

// Entity
export { Workflow } from './entity/workflow.js';
export type { WorkflowValues, TypePluginFactory } from './entity/workflow.js';

// Exception
export { RequiredStateMissingException } from './exception.js';

// Permissions
export { workflowsPermissions } from './permissions.js';
export type { PermissionDescriptor, PermissionSet } from './permissions.js';

// Routing
export { workflowsRoutes } from './routing.js';
export type { RouteDefinition } from './routing.js';

// Module / hooks
export {
  registerWorkflowsHooks,
  workflowsHelp,
  WORKFLOWS_MODULE,
  WORKFLOW_ENTITY_TYPE,
} from './module.js';
