import { describe, it, expect } from 'vitest';
import { PermissionHandler, USER_PERMISSIONS } from './permissions.js';

describe('user module permissions', () => {
  it('ports the permissions from user.permissions.yml', () => {
    expect(Object.keys(USER_PERMISSIONS).sort()).toEqual(
      [
        'access user profiles',
        'administer account settings',
        'administer permissions',
        'administer users',
        'cancel account',
        'change own username',
        'select account cancellation method',
        'view user email addresses',
      ].sort(),
    );
  });

  it('flags restricted permissions', () => {
    expect(USER_PERMISSIONS['administer permissions'].restrictAccess).toBe(true);
    expect(USER_PERMISSIONS['access user profiles'].restrictAccess).toBeUndefined();
  });

  it('the permission map is frozen (immutable)', () => {
    expect(Object.isFrozen(USER_PERMISSIONS)).toBe(true);
  });
});

describe('PermissionHandler', () => {
  it('lists and checks defined permissions', () => {
    const h = new PermissionHandler();
    expect(h.getPermissionNames()).toContain('administer users');
    expect(h.permissionExists('administer users')).toBe(true);
    expect(h.permissionExists('not a real permission')).toBe(false);
  });

  it('returns a defensive copy of the permission map', () => {
    const h = new PermissionHandler();
    const perms = h.getPermissions();
    delete (perms as Record<string, unknown>)['administer users'];
    // The original is untouched.
    expect(h.permissionExists('administer users')).toBe(true);
  });
});
