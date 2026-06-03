/**
 * Hook implementations for the `workspaces` module.
 *
 * Source: drupal-core/core/modules/workspaces/src/Hook/EntityAccess.php and
 * src/Hook/WorkspacesHooks.php.
 *
 * The PHP classes declare each hook with a `#[Hook(...)]` attribute; discovery is
 * handled here by {@link registerWorkspacesHooks}, which calls the ported
 * `@drupaljs/hook` ModuleHandler's `implement()` for each one — the TS-idiomatic
 * equivalent of attribute discovery.
 *
 * This slice ports the access-related hooks (`entity_access`,
 * `entity_create_access`) and `help`. The presave / insert / update entity hooks
 * delegate to the provider lifecycle (deferred behind TODO markers in
 * provider.ts) and are out of this vertical slice.
 */

import {
  AccessResult,
  type AccountLike,
  type EntityLike,
  type EntityTypeLike,
  type HookRegistrarLike,
  WORKSPACES_MODULE_NAME,
} from './types.js';
import type { WorkspaceManagerInterface } from './workspace-manager-interface.js';
import type { WorkspaceInformationInterface } from './workspace-information.js';

/** The route name for the module's help page. */
export const WORKSPACES_HELP_ROUTE = 'help.page.workspaces';

/** The bypass permission name. */
const BYPASS_PERMISSION = 'bypass entity access own workspace';

/**
 * Reacts to entity-access control hooks while a workspace is active.
 *
 * Ports `Drupal\workspaces\Hook\EntityAccess`.
 */
export class EntityAccessHooks {
  constructor(
    private readonly workspaceManager: WorkspaceManagerInterface,
    private readonly workspaceInfo: WorkspaceInformationInterface,
  ) {}

  /** Implements `hook_entity_access()`. */
  entityAccess(entity: EntityLike, operation: string, account: AccountLike): AccessResult {
    // Skip unsupported entity types or when no workspace is active.
    if (!this.workspaceInfo.isEntitySupported(entity) || !this.workspaceManager.hasActiveWorkspace()) {
      return AccessResult.neutral();
    }

    const activeWorkspace = this.workspaceManager.getActiveWorkspace()!;

    // Prevent deleting entities that have a published default revision.
    if (operation === 'delete') {
      const isDeletable = this.workspaceInfo.isEntityDeletable(entity, activeWorkspace);
      return AccessResult.forbiddenIf(!isDeletable);
    }

    return this.bypassAccessResult(account);
  }

  /** Implements `hook_entity_create_access()`. */
  entityCreateAccess(account: AccountLike, entityType: EntityTypeLike): AccessResult {
    if (!this.workspaceInfo.isEntityTypeSupported(entityType) || !this.workspaceManager.hasActiveWorkspace()) {
      return AccessResult.neutral();
    }
    return this.bypassAccessResult(account);
  }

  /**
   * The "bypass" access policy: the owner of the active workspace who holds the
   * bypass permission gets all edit/update/delete access within it.
   *
   * Ports `EntityAccess::bypassAccessResult()`.
   */
  private bypassAccessResult(account: AccountLike): AccessResult {
    const activeWorkspace = this.workspaceManager.getActiveWorkspace()!;
    const isOwner = AccessResult.allowedIf(activeWorkspace.getOwnerId() === account.id());
    return isOwner.andIf(AccessResult.allowedIfHasPermission(account, BYPASS_PERMISSION));
  }
}

/**
 * Implements `hook_help()` for the workspaces module.
 *
 * Ports the structural content of `WorkspacesHooks::help()`.
 */
export function workspacesHelp(routeName: string): string | null {
  if (routeName === WORKSPACES_HELP_ROUTE) {
    return (
      'The Workspaces module allows workspaces to be defined and switched ' +
      'between. Content can be staged in a workspace and published to the live ' +
      'site as a single operation.'
    );
  }
  return null;
}

/**
 * Registers every ported `workspaces` hook implementation with a module handler.
 *
 * The TS equivalent of `#[Hook(...)]` attribute discovery.
 */
export function registerWorkspacesHooks(
  handler: HookRegistrarLike,
  entityAccessHooks: EntityAccessHooks,
): void {
  handler.implement(WORKSPACES_MODULE_NAME, 'entity_access', (entity: EntityLike, operation: string, account: AccountLike) =>
    entityAccessHooks.entityAccess(entity, operation, account),
  );
  handler.implement(
    WORKSPACES_MODULE_NAME,
    'entity_create_access',
    (account: AccountLike, entityType: EntityTypeLike) =>
      entityAccessHooks.entityCreateAccess(account, entityType),
  );
  handler.implement(WORKSPACES_MODULE_NAME, 'help', (routeName: string) => workspacesHelp(routeName));
}
