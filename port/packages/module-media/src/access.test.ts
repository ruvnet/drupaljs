import { describe, it, expect } from 'vitest';
import {
  createMediaAccessControlHandler,
  allowed,
  forbidden,
  neutral,
} from './access.js';
import type { AccountInterface, MediaInterface } from './contracts.js';

/** A scriptable account double (London-school mock). */
function account(id: number, perms: string[]): AccountInterface {
  const set = new Set(perms);
  return { id: () => id, hasPermission: (p) => set.has(p) };
}

/** A minimal media stub for access checks. */
function media(bundle: string, ownerId: number, published: boolean): MediaInterface {
  return {
    id: () => 1,
    uuid: () => 'u',
    bundle: () => bundle,
    getOwnerId: () => ownerId,
    isPublished: () => published,
    getName: () => 'm',
    setName() {
      return this;
    },
    getCreatedTime: () => 0,
    getSource: () => {
      throw new Error('not used');
    },
    get: () => ({ isEmpty: () => true }),
  };
}

describe('AccessResult helpers', () => {
  it('allowed() is allowed', () => {
    expect(allowed().outcome).toBe('allowed');
    expect(allowed().isAllowed()).toBe(true);
  });
  it('neutral() / forbidden() are not allowed and can carry a reason', () => {
    expect(neutral('why').isAllowed()).toBe(false);
    expect(neutral('why').reason).toBe('why');
    expect(forbidden().outcome).toBe('forbidden');
  });
});

describe('MediaAccessControlHandler', () => {
  const handler = createMediaAccessControlHandler();

  it('lets the admin permission override every operation', () => {
    const acct = account(2, ['administer media']);
    expect(handler.checkAccess(media('image', 5, false), 'view', acct).isAllowed()).toBe(true);
    expect(handler.checkAccess(media('image', 5, false), 'delete', acct).isAllowed()).toBe(true);
  });

  it('allows viewing a published item with "view media"', () => {
    const acct = account(7, ['view media']);
    expect(handler.checkAccess(media('image', 9, true), 'view', acct).isAllowed()).toBe(true);
  });

  it('only the owner may view their own unpublished item', () => {
    const owner = account(9, ['view own unpublished media']);
    const other = account(3, ['view own unpublished media']);
    expect(handler.checkAccess(media('image', 9, false), 'view', owner).isAllowed()).toBe(true);
    expect(handler.checkAccess(media('image', 9, false), 'view', other).isAllowed()).toBe(false);
  });

  it('grants update via "edit any <bundle> media"', () => {
    const acct = account(3, ['edit any image media']);
    expect(handler.checkAccess(media('image', 99, true), 'update', acct).isAllowed()).toBe(true);
  });

  it('grants update via "edit own <bundle> media" only for owner', () => {
    const owner = account(4, ['edit own image media']);
    const other = account(5, ['edit own image media']);
    expect(handler.checkAccess(media('image', 4, true), 'update', owner).isAllowed()).toBe(true);
    expect(handler.checkAccess(media('image', 4, true), 'update', other).isAllowed()).toBe(false);
  });

  it('grants delete via "delete any <bundle> media"', () => {
    const acct = account(3, ['delete any audio media']);
    expect(handler.checkAccess(media('audio', 1, true), 'delete', acct).isAllowed()).toBe(true);
  });

  it('returns neutral for an unknown operation', () => {
    const acct = account(3, ['view media']);
    expect(handler.checkAccess(media('image', 1, true), 'frobnicate', acct).outcome).toBe('neutral');
  });

  it('create access requires create/admin/bundle-create permission (OR)', () => {
    expect(handler.checkCreateAccess(account(3, ['create media']), 'image').isAllowed()).toBe(true);
    expect(handler.checkCreateAccess(account(3, ['create image media']), 'image').isAllowed()).toBe(true);
    expect(handler.checkCreateAccess(account(3, []), 'image').isAllowed()).toBe(false);
  });
});
