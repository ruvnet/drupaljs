/**
 * Workspace providers — the access policy + lifecycle hooks for a workspace.
 *
 * Source: drupal-core/core/modules/workspaces/src/Provider/*.
 *
 * This slice ports the access-policy half of `WorkspaceProviderBase` /
 * `DefaultWorkspaceProvider` (`checkAccess`) and the `WorkspaceProviderCollector`
 * lookup. The entity-lifecycle methods (`entityPresave`, `entityInsert`, …)
 * depend on revision/tracking storage that lives outside this vertical slice and
 * are deferred behind TODO markers.
 */

import {
  AccessResult,
  type AccountLike,
  type WorkspaceLike,
} from './types.js';
import { DEFAULT_WORKSPACE_PROVIDER_ID } from './workspace.js';

/** The provider contract used by access checks. */
export interface WorkspaceProviderInterface {
  getId(): string;
  checkAccess(workspace: WorkspaceLike, operation: string, account: AccountLike): AccessResult;
}

/**
 * Base class for workspace providers — implements the shared access policy.
 *
 * Ports `WorkspaceProviderBase::checkAccess()`.
 */
export abstract class WorkspaceProviderBase implements WorkspaceProviderInterface {
  abstract getId(): string;

  checkAccess(workspace: WorkspaceLike, operation: string, account: AccountLike): AccessResult {
    // Only top-level workspaces can be published.
    if (operation === 'publish' && workspace.hasParent()) {
      return AccessResult.forbidden('Only top-level workspaces can be published.');
    }

    // The site administrator can do anything.
    if (account.hasPermission('administer workspaces')) {
      return AccessResult.allowed();
    }

    // Map operations onto the permission families (view / edit / delete).
    let permissionOperation: string;
    switch (operation) {
      case 'update':
      case 'publish':
        permissionOperation = 'edit';
        break;
      case 'view all revisions':
        permissionOperation = 'view';
        break;
      default:
        permissionOperation = operation;
        break;
    }

    // "any workspace" grants access irrespective of ownership.
    let result = AccessResult.allowedIfHasPermission(account, `${permissionOperation} any workspace`);

    // Otherwise fall back to the "own workspace" permission for the owner.
    if (
      result.isNeutral() &&
      account.isAuthenticated() &&
      account.id() === workspace.getOwnerId()
    ) {
      result = AccessResult.allowedIfHasPermission(account, `${permissionOperation} own workspace`);
    }

    return result;
  }
}

/**
 * The default workspace provider.
 *
 * Ports `DefaultWorkspaceProvider`.
 */
export class DefaultWorkspaceProvider extends WorkspaceProviderBase {
  static getId(): string {
    return DEFAULT_WORKSPACE_PROVIDER_ID;
  }

  getId(): string {
    return DEFAULT_WORKSPACE_PROVIDER_ID;
  }
}

/**
 * Resolves a workspace provider by id.
 *
 * Ports `WorkspaceProviderCollector::getProvider()` — registered providers keyed
 * by id, with the default provider as the fallback (the PHP collector throws on
 * an unknown id, but our vertical slice only ships the default provider, so an
 * unknown id resolves to it; tightened once more providers land).
 *
 * TODO(@drupaljs/workspaces): throw on unknown ids once non-default providers
 * are registered.
 */
export class WorkspaceProviderCollector {
  private readonly providers = new Map<string, WorkspaceProviderInterface>();
  private readonly fallback: WorkspaceProviderInterface;

  constructor(providers: WorkspaceProviderInterface[] = [new DefaultWorkspaceProvider()]) {
    for (const provider of providers) {
      this.providers.set(provider.getId(), provider);
    }
    this.fallback =
      this.providers.get(DEFAULT_WORKSPACE_PROVIDER_ID) ?? new DefaultWorkspaceProvider();
  }

  getProvider(id: string): WorkspaceProviderInterface {
    return this.providers.get(id) ?? this.fallback;
  }
}
