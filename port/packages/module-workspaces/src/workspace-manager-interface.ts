/**
 * The workspace-manager contract.
 *
 * Source: drupal-core/core/modules/workspaces/src/WorkspaceManagerInterface.php.
 *
 * The deprecated `purgeDeletedWorkspacesBatch()` member is intentionally
 * omitted (no-op / removed in Drupal 12).
 */

import type { WorkspaceLike } from './types.js';

export interface WorkspaceManagerInterface {
  /** True when a workspace is active in the current request. */
  hasActiveWorkspace(): boolean;
  /** The active workspace, or null. */
  getActiveWorkspace(): WorkspaceLike | null;
  /**
   * Sets the active workspace.
   *
   * @param persist - Persist via the first applicable negotiator (default true).
   * @throws WorkspaceAccessException When the user can't view the workspace.
   */
  setActiveWorkspace(workspace: WorkspaceLike, persist?: boolean): this;
  /** Unsets the active workspace (switch to Live). */
  switchToLive(): this;
  /** Executes a callback in the context of a workspace, then restores state. */
  executeInWorkspace<T>(workspaceId: string, fn: () => T): T;
  /** Executes a callback without any workspace context, then restores state. */
  executeOutsideWorkspace<T>(fn: () => T): T;
}
