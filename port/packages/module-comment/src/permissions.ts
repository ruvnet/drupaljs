/**
 * Comment module permission definitions.
 *
 * Faithful port of comment.permissions.yml. In Drupal these are discovered from
 * YAML and surfaced through the permission handler; here they are an explicit,
 * typed table the access handler and any permission UI can consume.
 */

export interface PermissionDefinition {
  /** Human-readable permission title. */
  readonly title: string;
  /**
   * When true the permission is "restricted" — granting it has security
   * implications and the UI warns the administrator. Ports `restrict access`.
   */
  readonly restrictAccess?: boolean;
}

/** Permission machine names provided by the comment module. */
export const CommentPermission = {
  AdministerComments: 'administer comments',
  AdministerCommentTypes: 'administer comment types',
  AccessComments: 'access comments',
  PostComments: 'post comments',
  SkipCommentApproval: 'skip comment approval',
  EditOwnComments: 'edit own comments',
} as const;

export type CommentPermissionName =
  (typeof CommentPermission)[keyof typeof CommentPermission];

/**
 * The full permission map, keyed by machine name. Mirrors the YAML exactly,
 * including the `restrict access: true` flag on "administer comment types".
 */
export const commentPermissions: Record<CommentPermissionName, PermissionDefinition> = {
  [CommentPermission.AdministerComments]: {
    title: 'Administer comments and comment settings',
  },
  [CommentPermission.AdministerCommentTypes]: {
    title: 'Administer comment types and settings',
    restrictAccess: true,
  },
  [CommentPermission.AccessComments]: { title: 'View comments' },
  [CommentPermission.PostComments]: { title: 'Post comments' },
  [CommentPermission.SkipCommentApproval]: { title: 'Skip comment approval' },
  [CommentPermission.EditOwnComments]: { title: 'Edit own comments' },
};
