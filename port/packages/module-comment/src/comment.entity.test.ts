import { describe, it, expect, vi } from 'vitest';
import {
  Comment,
  type CommentThreadStorage,
  type LockBackend,
  COMMENT_PUBLISHED,
  COMMENT_NOT_PUBLISHED,
} from './index.js';

function makeComment(overrides = {}) {
  return new Comment({
    comment_type: 'comment',
    entity_id: 42,
    entity_type: 'node',
    field_name: 'comment',
    ...overrides,
  });
}

describe('Comment — construction & identity', () => {
  it('requires a comment_type bundle', () => {
    // @ts-expect-error intentionally missing required field
    expect(() => new Comment({})).toThrow(/comment_type/);
  });

  it('reports new when it has no cid, and the bundle/type id', () => {
    const c = makeComment();
    expect(c.isNew()).toBe(true);
    expect(c.id()).toBeNull();
    expect(c.bundle()).toBe('comment');
    expect(c.getTypeId()).toBe('comment');
  });

  it('is not new once a cid is assigned', () => {
    expect(makeComment({ cid: 7 }).isNew()).toBe(false);
    expect(makeComment({ cid: 7 }).id()).toBe(7);
  });
});

describe('Comment — published state (EntityPublishedTrait)', () => {
  it('defaults to published', () => {
    expect(makeComment().isPublished()).toBe(true);
  });

  it('setPublished / setUnpublished toggle status', () => {
    const c = makeComment();
    expect(c.setUnpublished().isPublished()).toBe(false);
    expect(c.setPublished().isPublished()).toBe(true);
  });

  it('honours an explicit status value', () => {
    expect(makeComment({ status: COMMENT_NOT_PUBLISHED }).isPublished()).toBe(false);
  });
});

describe('Comment — getters & setters (port CommentInterface)', () => {
  it('subject defaults to empty string and round-trips', () => {
    const c = makeComment();
    expect(c.getSubject()).toBe('');
    expect(c.setSubject('Hello').getSubject()).toBe('Hello');
  });

  it('author name / email / homepage / hostname accessors', () => {
    const c = makeComment({ name: 'Anon', mail: 'a@b.c', homepage: 'http://x', hostname: 'h' });
    expect(c.getAuthorName()).toBe('Anon');
    expect(c.getAuthorEmail()).toBe('a@b.c');
    expect(c.getHomepage()).toBe('http://x');
    expect(c.getHostname()).toBe('h');
    expect(c.setAuthorName('Bob').getAuthorName()).toBe('Bob');
    expect(c.setHomepage('http://y').getHomepage()).toBe('http://y');
    expect(c.setHostname('h2').getHostname()).toBe('h2');
  });

  it('field name and created time accessors', () => {
    const c = makeComment();
    expect(c.getFieldName()).toBe('comment');
    expect(c.setFieldName('field_other').getFieldName()).toBe('field_other');
    expect(c.getCreatedTime()).toBeNull();
    expect(c.setCreatedTime(1000).getCreatedTime()).toBe(1000);
  });

  it('commented-entity accessors', () => {
    const c = makeComment();
    expect(c.getCommentedEntityId()).toBe(42);
    expect(c.getCommentedEntityTypeId()).toBe('node');
  });

  it('permalink ports Comment::permalink() with a comment fragment', () => {
    expect(makeComment({ cid: 9 }).permalink()).toBe('/comment/9#comment-9');
  });
});

describe('Comment — parent relations', () => {
  it('has no parent comment by default', () => {
    const c = makeComment();
    expect(c.hasParentComment()).toBe(false);
    expect(c.getParentComment()).toBeNull();
  });

  it('reports a parent when pid + parent entity are present', () => {
    const parent = makeComment({ cid: 1, thread: '01/' });
    const c = makeComment({ pid: 1, parent });
    expect(c.hasParentComment()).toBe(true);
    expect(c.getParentComment()).toBe(parent);
  });
});

describe('Comment — getDefaultStatus (ports Comment::getDefaultStatus)', () => {
  it('publishes when the account may skip approval', () => {
    const account = { hasPermission: vi.fn().mockReturnValue(true) };
    expect(Comment.getDefaultStatus(account)).toBe(COMMENT_PUBLISHED);
    expect(account.hasPermission).toHaveBeenCalledWith('skip comment approval');
  });

  it('leaves unpublished otherwise', () => {
    const account = { hasPermission: () => false };
    expect(Comment.getDefaultStatus(account)).toBe(COMMENT_NOT_PUBLISHED);
  });
});

describe('Comment — preSave thread placement (ports Comment::preSave)', () => {
  const alwaysAcquire: LockBackend = { acquire: () => true, release: () => undefined };

  it('assigns the first root thread when none exist', () => {
    const storage: CommentThreadStorage = {
      getMaxThread: () => '',
      getMaxThreadPerThread: () => '',
    };
    const c = makeComment();
    c.preSave(storage, alwaysAcquire);
    // n starts at 0, ++n -> 1 -> intToAlphadecimal(1) = '01'.
    expect(c.getThread()).toBe('01/');
  });

  it('increments the next root thread from the current max', () => {
    const storage: CommentThreadStorage = {
      getMaxThread: () => '01/',
      getMaxThreadPerThread: () => '',
    };
    const c = makeComment();
    c.preSave(storage, alwaysAcquire);
    expect(c.getThread()).toBe('02/');
  });

  it('places the first reply under its parent thread', () => {
    const parent = makeComment({ cid: 1, thread: '01/' });
    const storage: CommentThreadStorage = {
      getMaxThread: () => '01/',
      getMaxThreadPerThread: () => '', // first child
    };
    const reply = makeComment({ pid: 1, parent });
    reply.preSave(storage, alwaysAcquire);
    expect(reply.getThread()).toBe('01.01/');
  });

  it('increments a sibling reply within an existing sub-thread', () => {
    const parent = makeComment({ cid: 1, thread: '01/' });
    const storage: CommentThreadStorage = {
      getMaxThread: () => '01/',
      getMaxThreadPerThread: () => '01.01/', // one existing child
    };
    const reply = makeComment({ pid: 1, parent });
    reply.preSave(storage, alwaysAcquire);
    expect(reply.getThread()).toBe('01.02/');
  });

  it('advances to the next integer when the lock is contended, then releases', () => {
    const storage: CommentThreadStorage = {
      getMaxThread: () => '',
      getMaxThreadPerThread: () => '',
    };
    // First acquire fails (contended), second succeeds.
    const acquire = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const release = vi.fn();
    const lock: LockBackend = { acquire, release };
    const c = makeComment();
    c.preSave(storage, lock);
    // Skipped '01/', took '02/'.
    expect(c.getThread()).toBe('02/');
    expect(acquire).toHaveBeenCalledTimes(2);

    c.releaseThreadLock(lock);
    expect(release).toHaveBeenCalledWith('comment:42:02/');
  });

  it('does not recompute the thread for an existing (non-new) comment', () => {
    const storage: CommentThreadStorage = {
      getMaxThread: vi.fn(() => '09/'),
      getMaxThreadPerThread: vi.fn(() => ''),
    };
    const c = makeComment({ cid: 5, thread: '03/' });
    c.preSave(storage, alwaysAcquire);
    expect(c.getThread()).toBe('03/');
    expect(storage.getMaxThread).not.toHaveBeenCalled();
  });
});
