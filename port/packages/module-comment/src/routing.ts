/**
 * Comment module route definitions.
 *
 * Faithful (minimal) port of comment.routing.yml — the core, non-deprecated
 * routes. Each route keeps Drupal's path, title, and access requirement so a
 * router package can register them. Controller/form/handler references are kept
 * as opaque string identifiers (as in the YAML) since those classes live in
 * other packages or are out of this vertical slice's scope.
 *
 * TODO(@drupaljs/routing): replace `RouteDefinition` with the shared Route type
 * once the routing package lands; this local shape models only the fields the
 * comment routes use.
 */

export interface RouteRequirements {
  /** `_permission` — required permission machine name. */
  readonly permission?: string;
  /** `_entity_access` — entity operation requirement, e.g. "comment.update". */
  readonly entityAccess?: string;
  /** `_csrf_token` — whether a CSRF token is required. */
  readonly csrfToken?: boolean;
  /** `_custom_access` — custom access callback identifier. */
  readonly customAccess?: string;
}

export interface RouteDefinition {
  /** Route path with `{slug}` placeholders, e.g. "/comment/{comment}/edit". */
  readonly path: string;
  /** `_title` static title, when present. */
  readonly title?: string;
  /** `_controller` callable identifier, when the route is controller-driven. */
  readonly controller?: string;
  /** `_form` / `_entity_form` identifier, when the route renders a form. */
  readonly form?: string;
  /** Access requirements. */
  readonly requirements: RouteRequirements;
}

/**
 * Core comment routes keyed by Drupal route name. Deprecated routes
 * (`comment.new_comments_node_links`) are intentionally omitted.
 */
export const commentRoutes: Record<string, RouteDefinition> = {
  'comment.admin': {
    path: '/admin/content/comment',
    title: 'Comments',
    form: '\\Drupal\\comment\\Form\\CommentAdminOverview',
    requirements: { permission: 'administer comments' },
  },
  'comment.admin_approval': {
    path: '/admin/content/comment/approval',
    title: 'Unapproved comments',
    form: '\\Drupal\\comment\\Form\\CommentAdminOverview',
    requirements: { permission: 'administer comments' },
  },
  'entity.comment.edit_form': {
    path: '/comment/{comment}/edit',
    title: 'Edit',
    form: 'comment.default',
    requirements: { entityAccess: 'comment.update' },
  },
  'comment.approve': {
    path: '/comment/{comment}/approve',
    title: 'Approve',
    controller: '\\Drupal\\comment\\Controller\\CommentController::commentApprove',
    requirements: { entityAccess: 'comment.approve', csrfToken: true },
  },
  'entity.comment.canonical': {
    path: '/comment/{comment}',
    controller: '\\Drupal\\comment\\Controller\\CommentController::commentPermalink',
    requirements: { entityAccess: 'comment.view' },
  },
  'entity.comment.delete_form': {
    path: '/comment/{comment}/delete',
    title: 'Delete',
    form: 'comment.delete',
    requirements: { entityAccess: 'comment.delete' },
  },
  'comment.reply': {
    path: '/comment/reply/{entity_type}/{entity}/{field_name}/{pid}',
    title: 'Add new comment',
    controller: '\\Drupal\\comment\\Controller\\CommentController::getReplyForm',
    requirements: {
      customAccess: '\\Drupal\\comment\\Controller\\CommentController::replyFormAccess',
    },
  },
  'entity.comment_type.collection': {
    path: '/admin/structure/comment',
    title: 'Comment types',
    requirements: { permission: 'administer comment types' },
  },
  'entity.comment_type.add_form': {
    path: '/admin/structure/comment/types/add',
    title: 'Add comment type',
    form: 'comment_type.add',
    requirements: { permission: 'administer comment types' },
  },
  'entity.comment_type.edit_form': {
    path: '/admin/structure/comment/manage/{comment_type}',
    form: 'comment_type.edit',
    requirements: { entityAccess: 'comment_type.update' },
  },
  'entity.comment_type.delete_form': {
    path: '/admin/structure/comment/manage/{comment_type}/delete',
    title: 'Delete',
    form: 'comment_type.delete',
    requirements: { entityAccess: 'comment_type.delete' },
  },
};
