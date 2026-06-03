/**
 * The workspace manager.
 *
 * Source: drupal-core/core/modules/workspaces/src/WorkspaceManager.php and
 * src/WorkspaceManagerInterface.php.
 *
 * Negotiates the active workspace for the current request, switches the active
 * workspace (dispatching a {@link WorkspaceSwitchEvent}, persisting via the first
 * applicable negotiator), and runs callbacks inside / outside a workspace
 * context with automatic restore.
 */

import {
  type EntityTypeManagerLike,
  type EventDispatcherLike,
  type RequestStackLike,
  type WorkspaceLike,
} from './types.js';
import { WorkspaceAccessException } from './access.js';
import { WorkspaceSwitchEvent } from './events.js';
import { WORKSPACE_ENTITY_TYPE_ID } from './types.js';
import type { WorkspaceNegotiatorInterface } from './negotiator.js';
import type { WorkspaceManagerInterface } from './workspace-manager-interface.js';

export class WorkspaceManager implements WorkspaceManagerInterface {
  /**
   * The resolved active workspace: a workspace, `false` (resolved to none), or
   * `null` (not yet resolved). Mirrors the PHP tri-state.
   */
  private activeWorkspace: WorkspaceLike | false | null = null;

  constructor(
    private readonly requestStack: RequestStackLike,
    private readonly negotiators: WorkspaceNegotiatorInterface[],
    private readonly entityTypeManager: EntityTypeManagerLike,
    private readonly eventDispatcher: EventDispatcherLike,
  ) {}

  hasActiveWorkspace(): boolean {
    return this.getActiveWorkspace() !== null;
  }

  getActiveWorkspace(): WorkspaceLike | null {
    if (this.activeWorkspace === null) {
      const request = this.requestStack.getCurrentRequest();
      let resolved: WorkspaceLike | undefined;

      for (const negotiator of this.negotiators) {
        if (!negotiator.applies(request)) continue;

        const workspaceId = negotiator.getActiveWorkspaceId(request);
        const candidate = workspaceId
          ? this.entityTypeManager.getStorage(WORKSPACE_ENTITY_TYPE_ID).load(workspaceId)
          : null;

        // 'view' access is checked when retrieving the active workspace too.
        if (candidate && candidate.access('view')) {
          negotiator.setActiveWorkspace(candidate);
          resolved = candidate;
          break;
        }
      }

      // No negotiator yielded a viewable workspace: default to Live (false).
      this.activeWorkspace = resolved ?? false;
    }

    return this.activeWorkspace === false ? null : this.activeWorkspace;
  }

  setActiveWorkspace(workspace: WorkspaceLike, persist = true): this {
    this.doSwitchWorkspace(workspace);

    if (persist) {
      const request = this.requestStack.getCurrentRequest();
      for (const negotiator of this.negotiators) {
        if (negotiator.applies(request)) {
          negotiator.setActiveWorkspace(workspace);
          break;
        }
      }
    }

    return this;
  }

  switchToLive(): this {
    this.doSwitchWorkspace(null);
    for (const negotiator of this.negotiators) {
      negotiator.unsetActiveWorkspace();
    }
    return this;
  }

  executeInWorkspace<T>(workspaceId: string, fn: () => T): T {
    const workspace = this.entityTypeManager.getStorage(WORKSPACE_ENTITY_TYPE_ID).load(workspaceId);
    if (!workspace) {
      throw new Error(`The ${workspaceId} workspace does not exist.`);
    }

    const previous = this.getActiveWorkspace();
    const shouldSwitch = !previous || previous.id() !== workspaceId;
    if (shouldSwitch) {
      this.doSwitchWorkspace(workspace, true);
    }
    try {
      return fn();
    } finally {
      if (shouldSwitch) {
        this.doSwitchWorkspace(previous, true);
      }
    }
  }

  executeOutsideWorkspace<T>(fn: () => T): T {
    const previous = this.getActiveWorkspace();
    if (previous) {
      this.doSwitchWorkspace(null, true);
    }
    try {
      return fn();
    } finally {
      if (previous) {
        this.doSwitchWorkspace(previous, true);
      }
    }
  }

  /**
   * Switches the active workspace, view-checking and dispatching the event.
   *
   * Ports `WorkspaceManager::doSwitchWorkspace()`. The PHP `PHP_SAPI !== 'cli'`
   * carve-out (allow switching without view access on CLI) is preserved via the
   * optional `allowWithoutAccess` flag, defaulting to false (web request).
   */
  private doSwitchWorkspace(
    workspace: WorkspaceLike | null,
    isTemporary = false,
    allowWithoutAccess = false,
  ): void {
    if (workspace && !allowWithoutAccess && !workspace.access('view')) {
      throw new WorkspaceAccessException('The user does not have permission to view that workspace.');
    }

    const previous = this.activeWorkspace === false ? null : this.activeWorkspace;
    this.activeWorkspace = workspace ?? false;

    this.eventDispatcher.dispatch(
      new WorkspaceSwitchEvent(workspace ?? null, previous, isTemporary),
    );
  }
}
