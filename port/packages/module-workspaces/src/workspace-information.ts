/**
 * The workspace-support information service.
 *
 * Source: drupal-core/core/modules/workspaces/src/WorkspaceInformation.php and
 * src/WorkspaceInformationInterface.php.
 *
 * Determines whether an entity / entity type participates in workspaces. An
 * entity type is *supported* when it declares a `workspace` handler that is not
 * the `IgnoredWorkspaceHandler`; lacking a handler, it falls back to the
 * "publishable + revisionable" heuristic. Per-id results are memoised exactly as
 * in the PHP service.
 */

import type { EntityLike, EntityTypeLike, WorkspaceLike } from './types.js';

/**
 * The handler class name that marks an entity type as explicitly ignored.
 *
 * Mirrors `Drupal\workspaces\Entity\Handler\IgnoredWorkspaceHandler`.
 */
export const IGNORED_WORKSPACE_HANDLER_CLASS = 'IgnoredWorkspaceHandler';

/** Contract ported from `WorkspaceInformationInterface`. */
export interface WorkspaceInformationInterface {
  isEntitySupported(entity: EntityLike): boolean;
  isEntityTypeSupported(entityType: EntityTypeLike): boolean;
  isEntityIgnored(entity: EntityLike): boolean;
  isEntityTypeIgnored(entityType: EntityTypeLike): boolean;
  /**
   * Whether an entity may be deleted in the given workspace.
   *
   * Ports `WorkspaceInformationInterface::isEntityDeletable()` — an entity is
   * deletable in a workspace only when its initial (first) revision was created
   * in that workspace, so deleting it cannot affect Live content.
   */
  isEntityDeletable(entity: EntityLike, workspace: WorkspaceLike): boolean;
}

/**
 * Minimal workspace-tracker seam used by {@link WorkspaceInformation.isEntityDeletable}.
 *
 * Mirrors the slice of `WorkspaceTrackerInterface` the support service needs.
 *
 * TODO(@drupaljs/workspaces): replace with the canonical WorkspaceTracker once
 * the tracking-storage slice is ported.
 */
export interface WorkspaceTrackerLike {
  /** Returns the initial-revision entity ids tracked for a workspace + type. */
  getTrackedInitialRevisions(workspaceId: string, entityTypeId: string): Array<number | string>;
}

export class WorkspaceInformation implements WorkspaceInformationInterface {
  /** entity-type id -> support status. */
  private readonly supported = new Map<string, boolean>();
  /** entity-type id -> ignored status. */
  private readonly ignored = new Map<string, boolean>();

  constructor(private readonly workspaceTracker?: WorkspaceTrackerLike) {}

  isEntityTypeSupported(entityType: EntityTypeLike): boolean {
    const id = entityType.id();
    const cached = this.supported.get(id);
    if (cached !== undefined) return cached;

    let supported: boolean;
    if (entityType.hasWorkspaceHandler()) {
      supported = entityType.getWorkspaceHandlerClass() !== IGNORED_WORKSPACE_HANDLER_CLASS;
    } else {
      // Fallback used before entity-type info has been altered (e.g. during
      // module install): publishable + revisionable types are supported.
      supported = entityType.isPublishable() && entityType.isRevisionable();
    }

    this.supported.set(id, supported);
    return supported;
  }

  isEntityTypeIgnored(entityType: EntityTypeLike): boolean {
    const id = entityType.id();
    const cached = this.ignored.get(id);
    if (cached !== undefined) return cached;

    const ignored =
      entityType.hasWorkspaceHandler() &&
      entityType.getWorkspaceHandlerClass() === IGNORED_WORKSPACE_HANDLER_CLASS;

    this.ignored.set(id, ignored);
    return ignored;
  }

  isEntitySupported(entity: EntityLike): boolean {
    const entityType = entity.getEntityType();
    if (!this.isEntityTypeSupported(entityType)) {
      return false;
    }
    // In Drupal a per-entity `workspace` handler refines this; without that
    // handler in the slice, type support is sufficient.
    // TODO(@drupaljs/workspaces): delegate to the entity-type's workspace
    // handler's isEntitySupported() once entity handlers are ported.
    return true;
  }

  isEntityIgnored(entity: EntityLike): boolean {
    return this.isEntityTypeIgnored(entity.getEntityType());
  }

  isEntityDeletable(entity: EntityLike, workspace: WorkspaceLike): boolean {
    if (!this.workspaceTracker) {
      // Without a tracker the conservative answer is "not deletable in a
      // workspace" — matching the PHP behaviour when no initial revision was
      // tracked for the entity in this workspace.
      return false;
    }
    const initialRevisions = this.workspaceTracker.getTrackedInitialRevisions(
      workspace.id(),
      entity.getEntityTypeId(),
    );
    return initialRevisions.includes(entity.id());
  }
}
