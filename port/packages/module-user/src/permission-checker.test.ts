import { describe, it, expect, vi } from 'vitest';
import { PermissionChecker, InMemoryRoleProvider } from './permission-checker.js';
import { Role } from './entity/role.js';
import { User } from './entity/user.js';
import type { AccountInterface, RoleProviderInterface } from './types.js';

describe('PermissionChecker (London-style with mocked role provider)', () => {
  it('grants when any of the account roles holds the permission', () => {
    const provider: RoleProviderInterface = {
      getRole: vi.fn((rid: string) =>
        rid === 'editor' ? new Role({ id: 'editor', permissions: ['access user profiles'] }) : undefined,
      ),
    };
    const checker = new PermissionChecker(provider);
    const account: AccountInterface = {
      id: () => 4,
      getRoles: () => ['authenticated', 'editor'],
      hasPermission: () => false,
      isAnonymous: () => false,
      isAuthenticated: () => true,
    };

    expect(checker.hasPermission('access user profiles', account)).toBe(true);
    // It consulted the provider for the account's roles.
    expect(provider.getRole).toHaveBeenCalledWith('editor');
  });

  it('denies when no resolved role holds the permission', () => {
    const provider: RoleProviderInterface = { getRole: () => undefined };
    const checker = new PermissionChecker(provider);
    const account: AccountInterface = {
      id: () => 4,
      getRoles: () => ['authenticated'],
      hasPermission: () => false,
      isAnonymous: () => false,
      isAuthenticated: () => true,
    };
    expect(checker.hasPermission('administer users', account)).toBe(false);
  });
});

describe('PermissionChecker — integration with real entities', () => {
  it('aggregates permissions across multiple roles and short-circuits on admin', () => {
    const provider = new InMemoryRoleProvider([
      new Role({ id: 'authenticated', permissions: ['access user profiles'] }),
      new Role({ id: 'editor', permissions: ['change own username'] }),
    ]);
    const checker = new PermissionChecker(provider);
    const user = new User({ uid: 9, roles: ['editor'] }, checker);

    expect(user.hasPermission('access user profiles')).toBe(true); // from authenticated
    expect(user.hasPermission('change own username')).toBe(true); // from editor
    expect(user.hasPermission('administer users')).toBe(false);

    provider.addRole(new Role({ id: 'super', is_admin: true }));
    const admin = new User({ uid: 1, roles: ['super'] }, checker);
    expect(admin.hasPermission('administer users')).toBe(true);
  });
});
