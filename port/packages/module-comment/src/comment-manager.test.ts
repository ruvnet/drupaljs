import { describe, it, expect, vi } from 'vitest';
import {
  CommentManager,
  type CommentFieldMapProvider,
  type RolePermissionChecker,
} from './index.js';

function makeManager(
  fieldMap: Record<string, Record<string, unknown>>,
  authenticatedCanPost: boolean,
) {
  const fieldMapProvider: CommentFieldMapProvider = {
    getCommentFieldMap: vi.fn(() => fieldMap),
  };
  const roles: RolePermissionChecker = {
    authenticatedRoleHasPermission: vi.fn(() => authenticatedCanPost),
  };
  return { manager: new CommentManager(fieldMapProvider, roles), fieldMapProvider, roles };
}

describe('CommentManager — getFields (ports CommentManager::getFields)', () => {
  it('returns the comment fields for an entity type', () => {
    const { manager } = makeManager(
      { node: { comment: { type: 'comment' } } },
      false,
    );
    expect(manager.getFields('node')).toEqual({ comment: { type: 'comment' } });
  });

  it('returns an empty object when the entity type has no comment fields', () => {
    const { manager } = makeManager({ node: { comment: {} } }, false);
    expect(manager.getFields('user')).toEqual({});
  });
});

describe('CommentManager — forbiddenMessage (ports CommentManager::forbiddenMessage)', () => {
  it('prompts to log in/register when authenticated users may post', () => {
    const { manager } = makeManager({}, true);
    expect(manager.forbiddenMessage()).toMatch(/Log in or register/);
  });

  it('returns an empty string when authenticated users cannot post', () => {
    const { manager } = makeManager({}, false);
    expect(manager.forbiddenMessage()).toBe('');
  });

  it('memoises the authenticated-can-post probe (single role lookup)', () => {
    const { manager, roles } = makeManager({}, true);
    manager.forbiddenMessage();
    manager.forbiddenMessage();
    expect(roles.authenticatedRoleHasPermission).toHaveBeenCalledTimes(1);
  });
});

describe('CommentManager — threading mode constants', () => {
  it('exposes COMMENT_MODE_FLAT / COMMENT_MODE_THREADED', () => {
    expect(CommentManager.COMMENT_MODE_FLAT).toBe(0);
    expect(CommentManager.COMMENT_MODE_THREADED).toBe(1);
  });
});
