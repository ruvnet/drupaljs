/**
 * Media access control. Ports core/modules/media/src/MediaAccessControlHandler.
 *
 * Cacheability metadata (cache contexts/tags/max-age) from the PHP original is
 * intentionally omitted — only the boolean access decision and reason are
 * modelled in this slice. TODO(@drupaljs/access): bubble cacheability once the
 * access package lands.
 */
import type { AccessResult, AccountInterface, MediaInterface } from './contracts.js';

/** Admin permission that overrides every media operation. */
const ADMIN_PERMISSION = 'administer media';

class AccessResultImpl implements AccessResult {
  constructor(
    readonly outcome: AccessResult['outcome'],
    readonly reason?: string,
  ) {}
  isAllowed(): boolean {
    return this.outcome === 'allowed';
  }
}

/** AccessResult::allowed(). */
export const allowed = (): AccessResult => new AccessResultImpl('allowed');
/** AccessResult::forbidden(). */
export const forbidden = (reason?: string): AccessResult => new AccessResultImpl('forbidden', reason);
/** AccessResult::neutral(). */
export const neutral = (reason?: string): AccessResult => new AccessResultImpl('neutral', reason);
/** AccessResult::allowedIf(condition). */
const allowedIf = (condition: boolean, reason?: string): AccessResult =>
  condition ? allowed() : neutral(reason);

/** Access control handler for media items. */
export interface MediaAccessControlHandler {
  /**
   * Checks access for an operation on a media item.
   * Operations: view, update, delete, view revision, revert, delete revision.
   */
  checkAccess(media: MediaInterface, operation: string, account: AccountInterface): AccessResult;
  /** Checks create access for a given bundle (media type id). */
  checkCreateAccess(account: AccountInterface, bundle: string): AccessResult;
}

export function createMediaAccessControlHandler(): MediaAccessControlHandler {
  return {
    checkAccess(media, operation, account): AccessResult {
      // Admin permission overrides all operations.
      if (account.hasPermission(ADMIN_PERMISSION)) {
        return allowed();
      }

      const type = media.bundle();
      const isOwner = account.id() !== 0 && account.id() === media.getOwnerId();

      switch (operation) {
        case 'view':
          if (media.isPublished()) {
            return allowedIf(
              account.hasPermission('view media'),
              "The 'view media' permission is required when the media item is published.",
            );
          }
          if (account.hasPermission('view own unpublished media')) {
            return allowedIf(
              isOwner,
              "The user must be the owner and the 'view own unpublished media' permission is required when the media item is unpublished.",
            );
          }
          return neutral(
            "The user must be the owner and the 'view own unpublished media' permission is required when the media item is unpublished.",
          );

        case 'update':
          if (account.hasPermission(`edit any ${type} media`)) return allowed();
          if (account.hasPermission(`edit own ${type} media`) && isOwner) return allowed();
          if (account.hasPermission('update any media')) return allowed();
          if (account.hasPermission('update media') && isOwner) return allowed();
          return neutral(
            `The following permissions are required: 'update any media' OR 'update own media' OR '${type}: edit any media' OR '${type}: edit own media'.`,
          );

        case 'delete':
          if (account.hasPermission(`delete any ${type} media`)) return allowed();
          if (account.hasPermission(`delete own ${type} media`) && isOwner) return allowed();
          if (account.hasPermission('delete any media')) return allowed();
          if (account.hasPermission('delete media') && isOwner) return allowed();
          return neutral(
            `The following permissions are required: 'delete any media' OR 'delete own media' OR '${type}: delete any media' OR '${type}: delete own media'.`,
          );

        case 'view all revisions':
        case 'view revision':
          return allowedIf(
            account.hasPermission(`view any ${type} media revisions`) ||
              account.hasPermission('view all media revisions'),
          );

        case 'revert':
          return allowedIf(account.hasPermission(`revert any ${type} media revisions`));

        case 'delete revision':
          return allowedIf(account.hasPermission(`delete any ${type} media revisions`));

        default:
          return neutral();
      }
    },

    checkCreateAccess(account, bundle): AccessResult {
      const any = [ADMIN_PERMISSION, 'create media', `create ${bundle} media`];
      return allowedIf(any.some((p) => account.hasPermission(p)));
    },
  };
}
