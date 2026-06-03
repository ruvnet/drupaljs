/**
 * CommentManager service. Ports `Drupal\comment\CommentManager` /
 * `CommentManagerInterface`.
 *
 * The real manager wires seven core services (entity type manager, config
 * factory, string translation, module handler, current user, field manager,
 * display repository). For this vertical slice we depend on small collaborator
 * interfaces (mock-first per ADR-0016) covering the two behaviours that carry
 * real logic: {@link getFields} and {@link forbiddenMessage}. `addBodyField`
 * and the deprecated `getCountNewComments` are intentionally out of scope.
 */

import { CommentMode } from './enums.js';

/**
 * Field-map collaborator. Ports the slice of EntityFieldManagerInterface used
 * by getFields(): the comment field map keyed by entity type id.
 *
 * TODO(@drupaljs/field): replace with EntityFieldManagerInterface.getFieldMapByFieldType.
 */
export interface CommentFieldMapProvider {
  /**
   * Returns the map of `comment`-typed fields, keyed by entity type id; each
   * value maps field name -> definition.
   */
  getCommentFieldMap(): Record<string, Record<string, unknown>>;
}

/** Current-user collaborator. */
export interface ManagerAccount {
  hasPermission(permission: string): boolean;
}

/** Role-permission lookup. Ports the authenticated-role permission probe. */
export interface RolePermissionChecker {
  /** Whether the authenticated role grants the given permission. */
  authenticatedRoleHasPermission(permission: string): boolean;
}

export interface CommentManagerInterface {
  getFields(entityTypeId: string): Record<string, unknown>;
  forbiddenMessage(): string;
}

export class CommentManager implements CommentManagerInterface {
  static readonly COMMENT_MODE_FLAT = CommentMode.Flat;
  static readonly COMMENT_MODE_THREADED = CommentMode.Threaded;

  /** Memoises the authenticated-can-post probe, as in the PHP property. */
  private authenticatedCanPostComments?: boolean;

  constructor(
    private readonly fieldMapProvider: CommentFieldMapProvider,
    private readonly roles: RolePermissionChecker,
  ) {}

  /**
   * Ports CommentManager::getFields(). Returns the comment field definitions
   * attached to the given entity type, keyed by field name (empty when none).
   */
  getFields(entityTypeId: string): Record<string, unknown> {
    const map = this.fieldMapProvider.getCommentFieldMap();
    return map[entityTypeId] ?? {};
  }

  /**
   * Ports the decision in CommentManager::forbiddenMessage(): returns a
   * login/register prompt only when the authenticated role can post comments,
   * otherwise an empty string. URL/markup construction is delegated to the
   * render layer; here we return the user-facing text (or '').
   */
  forbiddenMessage(): string {
    if (this.authenticatedCanPostComments === undefined) {
      this.authenticatedCanPostComments =
        this.roles.authenticatedRoleHasPermission('post comments');
    }
    if (this.authenticatedCanPostComments) {
      return 'Log in or register to post comments';
    }
    return '';
  }
}
