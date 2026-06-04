/**
 * The `comment` content entity. Ports `Drupal\comment\Entity\Comment` and
 * `Drupal\comment\CommentInterface`.
 *
 * This is a faithful but minimal vertical slice: it models the comment's data
 * fields, published state, ownership, the parent/commented-entity relations,
 * and the thread-placement algorithm from `Comment::preSave()`. The full
 * ContentEntityBase field system, storage, and cache invalidation live in other
 * packages and are stubbed behind small local collaborator interfaces with TODO
 * markers so they can be swapped for the real types later.
 */

import { COMMENT_NOT_PUBLISHED, COMMENT_PUBLISHED } from './enums.js';
import { intToAlphadecimal, alphadecimalToInt } from './thread.js';

/**
 * Storage collaborator used during {@link Comment.preSave} to compute thread
 * placement. Ports the subset of `CommentStorageInterface` the algorithm needs.
 *
 * TODO(@drupaljs/module-comment): expand to the full CommentStorageInterface
 * (loadThread, getChildCids, getDisplayOrdinal, etc.) when storage lands.
 */
export interface CommentThreadStorage {
  /** Max thread value among root (depth-0) comments on the commented entity. */
  getMaxThread(comment: CommentInterface): string;
  /** Max thread value among siblings under this comment's parent. */
  getMaxThreadPerThread(comment: CommentInterface): string;
}

/**
 * Lock collaborator. Ports the `\Drupal::lock()` calls in Comment::preSave/
 * postSave used to serialize thread allocation. `acquire` returns false when the
 * lock is held, prompting the algorithm to try the next thread integer.
 *
 * TODO(@drupaljs/lock): replace with the shared LockBackendInterface.
 */
export interface LockBackend {
  acquire(name: string): boolean;
  release(name: string): void;
}

/** Account collaborator. Ports the slice of AccountInterface used here. */
export interface Account {
  id(): number | string;
  isAnonymous(): boolean;
}

/** Construction values for a comment. */
export interface CommentValues {
  cid?: number | null;
  comment_type: string;
  subject?: string;
  uid?: number;
  name?: string | null;
  mail?: string | null;
  homepage?: string | null;
  hostname?: string;
  created?: number | null;
  thread?: string | null;
  /** Parent comment id (`pid`), 0/undefined for a root comment. */
  pid?: number | null;
  /** Parent comment entity, resolved by storage. */
  parent?: CommentInterface | null;
  entity_id?: number | string;
  entity_type?: string;
  field_name?: string;
  /** Published state. Ports the `status` entity key. */
  status?: number;
}

/** Ports Drupal\comment\CommentInterface (TS-idiomatic subset). */
export interface CommentInterface {
  id(): number | null;
  bundle(): string;
  getTypeId(): string;

  isPublished(): boolean;
  setPublished(): this;
  setUnpublished(): this;

  hasParentComment(): boolean;
  getParentComment(): CommentInterface | null;

  getCommentedEntityId(): number | string | undefined;
  getCommentedEntityTypeId(): string | undefined;

  setFieldName(fieldName: string): this;
  getFieldName(): string | undefined;

  getSubject(): string;
  setSubject(subject: string): this;

  getAuthorName(): string;
  setAuthorName(name: string): this;
  getAuthorEmail(): string | null | undefined;

  getHomepage(): string | null | undefined;
  setHomepage(homepage: string): this;

  getHostname(): string | undefined;
  setHostname(hostname: string): this;

  getCreatedTime(): number | null;
  setCreatedTime(created: number): this;

  getThread(): string | undefined;
  setThread(thread: string): this;

  permalink(): string;
}

export class Comment implements CommentInterface {
  static readonly ENTITY_TYPE_ID = 'comment';
  static readonly NOT_PUBLISHED = COMMENT_NOT_PUBLISHED;
  static readonly PUBLISHED = COMMENT_PUBLISHED;

  private values: CommentValues;
  private parent: CommentInterface | null;
  /** The thread for which a lock was acquired. Ports $threadLock. */
  private threadLock = '';

  constructor(values: CommentValues) {
    if (!values.comment_type) {
      throw new Error('A comment requires a comment_type (bundle).');
    }
    this.values = { status: COMMENT_PUBLISHED, ...values };
    this.parent = values.parent ?? null;
  }

  // -- Identity ------------------------------------------------------------

  id(): number | null {
    return this.values.cid ?? null;
  }

  isNew(): boolean {
    return this.values.cid === undefined || this.values.cid === null;
  }

  bundle(): string {
    return this.values.comment_type;
  }

  getTypeId(): string {
    return this.bundle();
  }

  // -- Published state (ports EntityPublishedTrait) ------------------------

  isPublished(): boolean {
    return this.values.status === COMMENT_PUBLISHED;
  }

  setPublished(): this {
    this.values.status = COMMENT_PUBLISHED;
    return this;
  }

  setUnpublished(): this {
    this.values.status = COMMENT_NOT_PUBLISHED;
    return this;
  }

  // -- Ownership -----------------------------------------------------------

  getOwnerId(): number {
    return this.values.uid ?? 0;
  }

  // -- Relations -----------------------------------------------------------

  hasParentComment(): boolean {
    return Boolean(this.values.pid);
  }

  getParentComment(): CommentInterface | null {
    return this.parent;
  }

  getCommentedEntityId(): number | string | undefined {
    return this.values.entity_id;
  }

  getCommentedEntityTypeId(): string | undefined {
    return this.values.entity_type;
  }

  setFieldName(fieldName: string): this {
    this.values.field_name = fieldName;
    return this;
  }

  getFieldName(): string | undefined {
    return this.values.field_name;
  }

  // -- Scalar fields -------------------------------------------------------

  getSubject(): string {
    return this.values.subject ?? '';
  }

  setSubject(subject: string): this {
    this.values.subject = subject;
    return this;
  }

  getAuthorName(): string {
    // For anonymous authors this is the typed name; otherwise the username is
    // resolved from the user entity in Drupal. Without the user package we
    // return the stored name (the anonymous case), matching the slice's scope.
    return this.values.name ?? '';
  }

  setAuthorName(name: string): this {
    this.values.name = name;
    return this;
  }

  getAuthorEmail(): string | null | undefined {
    return this.values.mail;
  }

  getHomepage(): string | null | undefined {
    return this.values.homepage;
  }

  setHomepage(homepage: string): this {
    this.values.homepage = homepage;
    return this;
  }

  getHostname(): string | undefined {
    return this.values.hostname;
  }

  setHostname(hostname: string): this {
    this.values.hostname = hostname;
    return this;
  }

  getCreatedTime(): number | null {
    return this.values.created ?? null;
  }

  setCreatedTime(created: number): this {
    this.values.created = created;
    return this;
  }

  getThread(): string | undefined {
    const thread = this.values.thread;
    return thread ? thread : undefined;
  }

  setThread(thread: string): this {
    this.values.thread = thread;
    return this;
  }

  /** Ports Comment::permalink() — the canonical url with a comment fragment. */
  permalink(): string {
    return `/comment/${this.id()}#comment-${this.id()}`;
  }

  // -- Thread placement (ports Comment::preSave()) -------------------------

  /**
   * Computes and assigns this comment's thread value, acquiring a lock to
   * serialize allocation. Faithful port of the new-comment branch of
   * `Comment::preSave()`. Idempotent for already-threaded comments.
   *
   * @param storage Thread storage collaborator.
   * @param lock Lock backend collaborator.
   */
  preSave(storage: CommentThreadStorage, lock: LockBackend): void {
    if (!this.isNew()) {
      return;
    }
    let thread = this.getThread();
    if (!thread) {
      if (this.threadLock) {
        throw new Error(
          'preSave() is called again without calling postSave() or releaseThreadLock()',
        );
      }

      let n: number;
      let prefix: string;

      if (!this.hasParentComment()) {
        // Root comment: start from the max root thread.
        let max = storage.getMaxThread(this);
        max = max.replace(/\/+$/, '');
        const parts = max.split('.');
        const head = parts[0] ?? '';
        n = head ? alphadecimalToInt(head) : 0;
        prefix = '';
      } else {
        // Reply: increment the part of the thread at the parent's depth.
        const parent = this.getParentComment();
        if (parent === null) {
          throw new Error('hasParentComment() is true but no parent entity is set.');
        }
        parent.setThread(parent.getThread()?.replace(/\/+$/, '') ?? '');
        prefix = `${parent.getThread()}.`;
        let max = storage.getMaxThreadPerThread(this);
        if (max === '') {
          // First child of this parent. Like the root case, sibling numbering
          // is 1-based: start at 0 so the ++n below yields 1, placing the first
          // reply at the parent's prefix + '01' (e.g. parent '01/' -> '01.01/').
          n = 0;
        } else {
          max = max.replace(/\/+$/, '');
          const parts = max.split('.');
          const parentDepth = (parent.getThread() ?? '').split('.').length;
          n = alphadecimalToInt(parts[parentDepth] ?? '00');
        }
      }

      // Acquire a lock on the thread; if held, advance to the next integer.
      let lockName = '';
      do {
        n += 1;
        thread = `${prefix}${intToAlphadecimal(n)}/`;
        lockName = `comment:${String(this.getCommentedEntityId())}:${thread}`;
      } while (!lock.acquire(lockName));
      this.threadLock = lockName;
    }
    this.setThread(thread);
  }

  /** Releases the lock acquired in {@link preSave}. Ports releaseThreadLock(). */
  releaseThreadLock(lock: LockBackend): void {
    if (this.threadLock) {
      lock.release(this.threadLock);
      this.threadLock = '';
    }
  }

  /**
   * Default published state for a new comment. Ports Comment::getDefaultStatus()
   * — published when the account may skip comment approval, else unpublished.
   */
  static getDefaultStatus(account: { hasPermission(permission: string): boolean }): number {
    return account.hasPermission('skip comment approval')
      ? COMMENT_PUBLISHED
      : COMMENT_NOT_PUBLISHED;
  }
}
