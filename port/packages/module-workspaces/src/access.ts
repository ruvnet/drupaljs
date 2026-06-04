/**
 * Workspace access control.
 *
 * Source: drupal-core/core/modules/workspaces/src/WorkspaceAccessControlHandler.php
 * and src/WorkspaceAccessException.php.
 */

import {
  AccessResult,
  type AccountLike,
  type WorkspaceLike,
} from './types.js';
import type { WorkspaceProviderCollector } from './provider.js';

/**
 * Thrown when the current user lacks access to view / switch to a workspace.
 *
 * Ports `WorkspaceAccessException`.
 */
export class WorkspaceAccessException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceAccessException';
  }
}

/**
 * The access control handler for the `workspace` entity type.
 *
 * Ports `WorkspaceAccessControlHandler`: entity-operation access is delegated to
 * the workspace's provider; create access is the OR of the admin and create
 * permissions.
 */
export class WorkspaceAccessControlHandler {
  constructor(private readonly providerCollector: WorkspaceProviderCollector) {}

  /**
   * Ports `checkAccess()` — delegate to the provider resolved for the workspace.
   *
   * @param providerId - The workspace's provider id (defaults to "default").
   */
  checkAccess(
    workspace: WorkspaceLike,
    operation: string,
    account: AccountLike,
    providerId = 'default',
  ): AccessResult {
    return this.providerCollector.getProvider(providerId).checkAccess(workspace, operation, account);
  }

  /** Ports `checkCreateAccess()` — admin OR create permission. */
  checkCreateAccess(account: AccountLike): AccessResult {
    return AccessResult.allowedIfHasAnyPermission(account, ['administer workspaces', 'create workspace']);
  }
}
