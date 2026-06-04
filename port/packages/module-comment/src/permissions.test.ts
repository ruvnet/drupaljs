import { describe, it, expect } from 'vitest';
import { CommentPermission, commentPermissions } from './index.js';

describe('comment permissions (ports comment.permissions.yml)', () => {
  it('defines the six comment permissions with their titles', () => {
    expect(Object.keys(commentPermissions).sort()).toEqual(
      [
        'access comments',
        'administer comment types',
        'administer comments',
        'edit own comments',
        'post comments',
        'skip comment approval',
      ].sort(),
    );
    expect(commentPermissions['administer comments'].title).toBe(
      'Administer comments and comment settings',
    );
    expect(commentPermissions['access comments'].title).toBe('View comments');
  });

  it('marks "administer comment types" as restricted access', () => {
    expect(commentPermissions['administer comment types'].restrictAccess).toBe(true);
  });

  it('does not mark the other permissions as restricted', () => {
    expect(commentPermissions['administer comments'].restrictAccess).toBeUndefined();
    expect(commentPermissions['post comments'].restrictAccess).toBeUndefined();
  });

  it('exposes machine-name constants matching the YAML keys', () => {
    expect(CommentPermission.AdministerComments).toBe('administer comments');
    expect(CommentPermission.PostComments).toBe('post comments');
    expect(CommentPermission.SkipCommentApproval).toBe('skip comment approval');
  });
});
