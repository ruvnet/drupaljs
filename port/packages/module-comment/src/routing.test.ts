import { describe, it, expect } from 'vitest';
import { commentRoutes } from './index.js';

describe('comment routes (ports comment.routing.yml)', () => {
  it('defines the comment admin overview route guarded by administer comments', () => {
    const route = commentRoutes['comment.admin'];
    expect(route?.path).toBe('/admin/content/comment');
    expect(route?.requirements.permission).toBe('administer comments');
  });

  it('defines the canonical comment route with comment.view entity access', () => {
    const route = commentRoutes['entity.comment.canonical'];
    expect(route?.path).toBe('/comment/{comment}');
    expect(route?.requirements.entityAccess).toBe('comment.view');
  });

  it('defines the approve route requiring a CSRF token and approve access', () => {
    const route = commentRoutes['comment.approve'];
    expect(route?.path).toBe('/comment/{comment}/approve');
    expect(route?.requirements.entityAccess).toBe('comment.approve');
    expect(route?.requirements.csrfToken).toBe(true);
  });

  it('defines comment type collection/add/edit/delete admin routes', () => {
    expect(commentRoutes['entity.comment_type.collection']?.path).toBe(
      '/admin/structure/comment',
    );
    expect(commentRoutes['entity.comment_type.add_form']?.requirements.permission).toBe(
      'administer comment types',
    );
    expect(commentRoutes['entity.comment_type.edit_form']?.requirements.entityAccess).toBe(
      'comment_type.update',
    );
  });

  it('uses a custom access callback for the reply route', () => {
    const route = commentRoutes['comment.reply'];
    expect(route?.path).toBe('/comment/reply/{entity_type}/{entity}/{field_name}/{pid}');
    expect(route?.requirements.customAccess).toMatch(/replyFormAccess$/);
  });

  it('omits the deprecated new_comments_node_links route', () => {
    expect(commentRoutes['comment.new_comments_node_links']).toBeUndefined();
  });
});
