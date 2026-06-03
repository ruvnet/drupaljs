/**
 * Access control for the comment entity. Ports
 * `Drupal\comment\CommentAccessControlHandler::checkAccess()` and
 * `checkCreateAccess()`.
 *
 * Drupal returns rich `AccessResult` objects carrying cacheability metadata; we
 * model a minimal three-state result (allowed / forbidden / neutral) with an
 * optional reason, which is the decision-relevant surface the comment module
 * exercises. Cacheability is out of this slice's scope.
 *
 * TODO(@drupaljs/access): replace `AccessResult` with the shared AccessResult
 * type (with cache contexts/tags) once the access package lands.
 */

import type { CommentInterface } from './comment.entity.js';

export type AccessOperation = 'view' | 'update' | 'delete' | 'approve' | string;

/** Account collaborator. Ports the slice of AccountInterface used here. */
export interface AccessAccount {
  id(): number | string;
  hasPermission(permission: string): boolean;
}

/** Minimal AccessResult: three-state with a reason. */
export class AccessResult {
  private constructor(
    private readonly kind: 'allowed' | 'forbidden' | 'neutral',
    public reason?: string,
  ) {}

  static allowed(): AccessResult {
    return new AccessResult('allowed');
  }

  static forbidden(reason?: string): AccessResult {
    return new AccessResult('forbidden', reason);
  }

  static neutral(reason?: string): AccessResult {
    return new AccessResult('neutral', reason);
  }

  static allowedIf(condition: boolean): AccessResult {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
  }

  static allowedIfHasPermission(account: AccessAccount, permission: string): AccessResult {
    return AccessResult.allowedIf(account.hasPermission(permission));
  }

  isAllowed(): boolean {
    return this.kind === 'allowed';
  }

  isForbidden(): boolean {
    return this.kind === 'forbidden';
  }

  isNeutral(): boolean {
    return this.kind === 'neutral';
  }

  setReason(reason: string): this {
    this.reason = reason;
    return this;
  }

  /** Ports AccessResult::andIf — forbidden wins, else both must allow. */
  andIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden(other.reason ?? this.reason);
    }
    if (this.isAllowed() && other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral(other.reason ?? this.reason);
  }

  /** Ports AccessResult::orIf — allowed wins (unless forbidden present). */
  orIf(other: AccessResult): AccessResult {
    if (this.isForbidden() || other.isForbidden()) {
      return AccessResult.forbidden();
    }
    if (this.isAllowed() || other.isAllowed()) {
      return AccessResult.allowed();
    }
    return AccessResult.neutral(this.reason ?? other.reason);
  }
}

/**
 * Optional gate for the entity a comment is attached to. Ports the
 * `$entity->getCommentedEntity()->access(...)` calls in checkAccess(). When not
 * supplied, the commented-entity check is treated as allowed (the comment-level
 * decision then stands on its own).
 *
 * TODO(@drupaljs/entity): wire to the real EntityInterface::access().
 */
export type CommentedEntityAccess = (
  operation: AccessOperation,
  account: AccessAccount,
) => AccessResult;

export class CommentAccessControlHandler {
  /**
   * Ports CommentAccessControlHandler::checkAccess().
   *
   * @param commentedEntityAccess Optional commented-entity access gate; see
   *   {@link CommentedEntityAccess}.
   */
  checkAccess(
    entity: CommentInterface & { getOwnerId(): number },
    operation: AccessOperation,
    account: AccessAccount,
    commentedEntityAccess?: CommentedEntityAccess,
  ): AccessResult {
    const gate = commentedEntityAccess ?? (() => AccessResult.allowed());
    const commentAdmin = account.hasPermission('administer comments');

    if (operation === 'approve') {
      return AccessResult.allowedIf(commentAdmin && !entity.isPublished());
    }

    if (commentAdmin) {
      const access = AccessResult.allowed();
      return operation !== 'view' ? access : access.andIf(gate(operation, account));
    }

    switch (operation) {
      case 'view': {
        const result = AccessResult.allowedIf(
          account.hasPermission('access comments') && entity.isPublished(),
        ).andIf(gate(operation, account));
        if (!result.isAllowed()) {
          result.setReason(
            "The 'access comments' permission is required and the comment must be published.",
          );
        }
        return result;
      }
      case 'update': {
        const result = AccessResult.allowedIf(
          Boolean(account.id()) &&
            account.id() === entity.getOwnerId() &&
            entity.isPublished() &&
            account.hasPermission('edit own comments'),
        );
        if (!result.isAllowed()) {
          result.setReason(
            "The 'edit own comments' permission is required, the user must be the comment author, and the comment must be published.",
          );
        }
        return result;
      }
      default:
        return AccessResult.neutral();
    }
  }

  /** Ports CommentAccessControlHandler::checkCreateAccess(). */
  checkCreateAccess(account: AccessAccount): AccessResult {
    return AccessResult.allowedIfHasPermission(account, 'post comments');
  }
}
