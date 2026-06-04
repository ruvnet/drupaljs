/**
 * HistoryManager service. Ports `Drupal\history\HistoryManager`.
 *
 * Sole method: {@link getCountNewComments}, counting published comments on an
 * entity created after the current user's last view of it.
 *
 * Collaborators are injected as small interfaces (mock-first per ADR-0016):
 * the current user, a module-existence probe (ModuleHandler slice), the history
 * repository (for the node "last viewed" timestamp), and a comment-count query.
 */

import type { HistoryAccount, HistoryRepository } from './history-repository.js';

/**
 * Default lower bound on "new" when no last-view timestamp is available: 30 days
 * ago. Ports COMMENT_NEW_LIMIT as used in HistoryManager (the entity wasn't a
 * node and no `<type>_last_viewed` resolver exists). Expressed as seconds before
 * the current request time, resolved against the repository's read limit.
 */
export interface EntityLike {
  /** The entity id. */
  id(): number;
  /** The entity type id, e.g. "node". */
  getEntityTypeId(): string;
}

/** Module-existence probe. Ports the ModuleHandler slice used here. */
export interface ModuleExistsProbe {
  moduleExists(module: string): boolean;
}

/**
 * Counts published comments on an entity created strictly after a timestamp.
 * Ports the comment entity query in HistoryManager::getCountNewComments().
 *
 * TODO(@drupaljs/module-comment): back this with the comment storage's
 * entity query once cross-package wiring lands.
 */
export interface NewCommentCounter {
  countNewComments(args: {
    entityTypeId: string;
    entityId: number;
    after: number;
    fieldName?: string;
  }): number;
}

export class HistoryManager {
  constructor(
    private readonly currentUser: HistoryAccount,
    private readonly moduleHandler: ModuleExistsProbe,
    private readonly repository: HistoryRepository,
    private readonly counter: NewCommentCounter,
  ) {}

  /**
   * Ports HistoryManager::getCountNewComments(). Returns the count of new
   * comments, or `false` when the user is anonymous or the comment module is
   * not installed.
   *
   * @param entity The commented entity.
   * @param fieldName Optional: limit to one comment field.
   * @param timestamp Optional: explicit "count from" time; when 0 (default) the
   *   user's last-view time for the node is used.
   */
  getCountNewComments(
    entity: EntityLike,
    fieldName?: string,
    timestamp = 0,
  ): number | false {
    if (!this.currentUser.isAuthenticated() || !this.moduleHandler.moduleExists('comment')) {
      return false;
    }

    let from = timestamp;
    if (!from) {
      if (entity.getEntityTypeId() === 'node') {
        from = this.repository.read(entity.id());
      } else {
        // @todo Remove when a generic HistoryRepository service exists
        //   (https://www.drupal.org/i/3267011). Default to 30 days ago.
        from = this.repository.readLimit();
      }
    }

    // Never count from before the read limit (entities older than 30 days are
    // always considered read).
    const readLimit = this.repository.readLimit();
    from = from > readLimit ? from : readLimit;

    return this.counter.countNewComments({
      entityTypeId: entity.getEntityTypeId(),
      entityId: entity.id(),
      after: from,
      ...(fieldName !== undefined ? { fieldName } : {}),
    });
  }
}
