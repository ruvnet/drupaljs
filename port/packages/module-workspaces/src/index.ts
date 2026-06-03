/**
 * @drupaljs/module-workspaces — TypeScript port of Drupal Core's `workspaces`
 * module (core vertical slice).
 *
 * Source: drupal-core/core/modules/workspaces/*
 *
 * The Workspaces module lets editors stage content changes in an isolated
 * workspace and publish them to Live atomically. This package ports the core
 * runtime surface:
 *
 * - **Entity**: the `workspace` content-entity definition + base fields
 *   (`Workspace`, `WorkspaceEntityDefinition`, `WORKSPACE_BASE_FIELD_DEFINITIONS`,
 *   `isValidWorkspaceId`).
 * - **Provider**: the access policy (`WorkspaceProviderBase`,
 *   `DefaultWorkspaceProvider`, `WorkspaceProviderCollector`).
 * - **Manager**: active-workspace negotiation + scoped execution
 *   (`WorkspaceManager`, `WorkspaceManagerInterface`).
 * - **Information**: workspace-support detection (`WorkspaceInformation`).
 * - **Negotiators**: `SessionWorkspaceNegotiator`,
 *   `QueryParameterWorkspaceNegotiator`.
 * - **Access**: `WorkspaceAccessControlHandler`, `WorkspaceAccessException`.
 * - **Events**: `WorkspaceSwitchEvent`.
 * - **Hooks**: `registerWorkspacesHooks` (registers `entity_access`,
 *   `entity_create_access`, `help` via `@drupaljs/hook`), the `EntityAccessHooks`
 *   class, and `workspacesHelp`.
 * - **Permissions / link relations**: `WORKSPACES_PERMISSIONS`,
 *   `WORKSPACES_LINK_RELATION_TYPES`.
 *
 * Deep collaborators (entity storage, the entity-type manager, the HTTP request
 * stack, sessions, the event dispatcher, the revision tracker) are modelled as
 * minimal LOCAL seam interfaces carrying TODO markers until the canonical
 * `@drupaljs/*` packages land.
 */

export {
  AccessResult,
  type AccessOutcome,
  type AccountLike,
  type RequestLike,
  type RequestStackLike,
  type SessionLike,
  type WorkspaceStorageLike,
  type EntityTypeManagerLike,
  type EventDispatcherLike,
  type EntityTypeLike,
  type EntityLike,
  type WorkspaceLike,
  type HookRegistrarLike,
  type WorkspacePermission,
  WORKSPACES_PERMISSIONS,
  WORKSPACES_LINK_RELATION_TYPES,
  WORKSPACES_MODULE_NAME,
  WORKSPACE_ENTITY_TYPE_ID,
  WORKSPACE_ID_PATTERN,
  WORKSPACE_MAX_LENGTH,
} from './types.js';

export {
  Workspace,
  WorkspaceEntityDefinition,
  WORKSPACE_BASE_FIELD_DEFINITIONS,
  DEFAULT_WORKSPACE_PROVIDER_ID,
  isValidWorkspaceId,
  type WorkspaceValues,
  type WorkspaceBaseFieldDefinition,
  type WorkspaceAccessChecker,
} from './workspace.js';

export {
  WorkspaceProviderBase,
  DefaultWorkspaceProvider,
  WorkspaceProviderCollector,
  type WorkspaceProviderInterface,
} from './provider.js';

export {
  WorkspaceInformation,
  IGNORED_WORKSPACE_HANDLER_CLASS,
  type WorkspaceInformationInterface,
  type WorkspaceTrackerLike,
} from './workspace-information.js';

export {
  SessionWorkspaceNegotiator,
  QueryParameterWorkspaceNegotiator,
  SESSION_ACTIVE_WORKSPACE_KEY,
  type WorkspaceNegotiatorInterface,
  type WorkspaceTokenFn,
} from './negotiator.js';

export { WorkspaceManager } from './workspace-manager.js';
export { type WorkspaceManagerInterface } from './workspace-manager-interface.js';

export { WorkspaceAccessControlHandler, WorkspaceAccessException } from './access.js';

export { WorkspaceSwitchEvent } from './events.js';

export {
  EntityAccessHooks,
  workspacesHelp,
  registerWorkspacesHooks,
  WORKSPACES_HELP_ROUTE,
} from './hooks.js';
