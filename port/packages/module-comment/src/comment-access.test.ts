import { describe, it, expect, vi } from 'vitest';
import {
  CommentAccessControlHandler,
  AccessResult,
  Comment,
  type AccessAccount,
} from './index.js';

function account(perms: string[], id: number | string = 1): AccessAccount {
  return {
    id: () => id,
    hasPermission: (p: string) => perms.includes(p),
  };
}

function comment(opts: { published?: boolean; ownerId?: number } = {}) {
  const c = new Comment({
    comment_type: 'comment',
    entity_id: 1,
    entity_type: 'node',
    field_name: 'comment',
    uid: opts.ownerId ?? 0,
    status: opts.published === false ? 0 : 1,
  });
  return c;
}

describe('CommentAccessControlHandler — checkAccess', () => {
  const handler = new CommentAccessControlHandler();

  it('admins may view only if the commented entity allows it', () => {
    const gate = vi.fn().mockReturnValue(AccessResult.allowed());
    const result = handler.checkAccess(
      comment(),
      'view',
      account(['administer comments']),
      gate,
    );
    expect(result.isAllowed()).toBe(true);
    expect(gate).toHaveBeenCalledWith('view', expect.anything());
  });

  it('admins may perform non-view operations unconditionally', () => {
    const result = handler.checkAccess(comment(), 'delete', account(['administer comments']));
    expect(result.isAllowed()).toBe(true);
  });

  it('approve is allowed for admins only when the comment is unpublished', () => {
    const admin = account(['administer comments']);
    expect(handler.checkAccess(comment({ published: false }), 'approve', admin).isAllowed()).toBe(true);
    expect(handler.checkAccess(comment({ published: true }), 'approve', admin).isAllowed()).toBe(false);
  });

  it('view requires access comments permission AND published, AND commented-entity access', () => {
    const allowGate = () => AccessResult.allowed();
    expect(
      handler
        .checkAccess(comment({ published: true }), 'view', account(['access comments']), allowGate)
        .isAllowed(),
    ).toBe(true);

    // Unpublished -> denied with the documented reason.
    const denied = handler.checkAccess(
      comment({ published: false }),
      'view',
      account(['access comments']),
      allowGate,
    );
    expect(denied.isAllowed()).toBe(false);
    expect(denied.reason).toMatch(/access comments/);

    // Commented entity forbids -> denied even when published + permitted.
    const gateForbids = () => AccessResult.forbidden();
    expect(
      handler
        .checkAccess(comment({ published: true }), 'view', account(['access comments']), gateForbids)
        .isAllowed(),
    ).toBe(false);
  });

  it('update requires ownership + published + edit own comments permission', () => {
    const owner = account(['edit own comments'], 7);
    expect(
      handler
        .checkAccess(comment({ published: true, ownerId: 7 }), 'update', owner)
        .isAllowed(),
    ).toBe(true);

    // Not the owner.
    expect(
      handler
        .checkAccess(comment({ published: true, ownerId: 99 }), 'update', owner)
        .isAllowed(),
    ).toBe(false);

    // Unpublished.
    const denied = handler.checkAccess(
      comment({ published: false, ownerId: 7 }),
      'update',
      owner,
    );
    expect(denied.isAllowed()).toBe(false);
    expect(denied.reason).toMatch(/edit own comments/);
  });

  it('returns neutral for unknown operations by non-admins', () => {
    expect(handler.checkAccess(comment(), 'frobnicate', account([])).isNeutral()).toBe(true);
  });
});

describe('CommentAccessControlHandler — checkCreateAccess', () => {
  const handler = new CommentAccessControlHandler();

  it('is allowed with the post comments permission', () => {
    expect(handler.checkCreateAccess(account(['post comments'])).isAllowed()).toBe(true);
  });

  it('is not allowed without it', () => {
    expect(handler.checkCreateAccess(account([])).isAllowed()).toBe(false);
  });
});

describe('AccessResult combinators', () => {
  it('andIf: forbidden wins', () => {
    expect(AccessResult.allowed().andIf(AccessResult.forbidden()).isForbidden()).toBe(true);
    expect(AccessResult.allowed().andIf(AccessResult.allowed()).isAllowed()).toBe(true);
    expect(AccessResult.allowed().andIf(AccessResult.neutral()).isNeutral()).toBe(true);
  });

  it('orIf: allowed wins unless forbidden present', () => {
    expect(AccessResult.neutral().orIf(AccessResult.allowed()).isAllowed()).toBe(true);
    expect(AccessResult.forbidden().orIf(AccessResult.allowed()).isForbidden()).toBe(true);
  });
});
