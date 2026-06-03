/**
 * Workspace events.
 *
 * Source: drupal-core/core/modules/workspaces/src/Event/*.
 *
 * This slice ports the `WorkspaceSwitchEvent` dispatched by the manager when the
 * active workspace changes. The publish lifecycle events
 * (`WorkspacePrePublishEvent` / `WorkspacePostPublishEvent`) belong to the
 * publisher slice and are deferred behind a TODO marker.
 *
 * TODO(@drupaljs/workspaces): port WorkspacePublishEvent / pre / post once the
 * WorkspacePublisher lands.
 */

import type { WorkspaceLike } from './types.js';

/**
 * Dispatched when the active workspace is switched.
 *
 * Ports `WorkspaceSwitchEvent`.
 */
export class WorkspaceSwitchEvent {
  constructor(
    /** The newly active workspace, or null when switching to Live. */
    public readonly activeWorkspace: WorkspaceLike | null,
    /** The previously active workspace, or null. */
    public readonly previousWorkspace: WorkspaceLike | null,
    /** Whether the switch is a temporary one that will be reverted. */
    public readonly isTemporary: boolean = false,
  ) {}
}
