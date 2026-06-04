import { describe, it, expect } from 'vitest';
import { PermissionAccess } from './permission-access.js';
import type { AccountInterface } from '../../contracts.js';

function account(perms: string[]): AccountInterface {
  return {
    id: () => 1,
    hasPermission: (p) => perms.includes(p),
    isAuthenticated: () => true,
  };
}

describe('PermissionAccess (ports views Permission access plugin)', () => {
  it('allows when the account holds the configured permission', () => {
    const plugin = new PermissionAccess({ perm: 'access content' });
    expect(plugin.access(account(['access content'])).isAllowed()).toBe(true);
  });

  it('is neutral when the account lacks the permission', () => {
    const plugin = new PermissionAccess({ perm: 'access content' });
    expect(plugin.access(account([])).isNeutral()).toBe(true);
  });

  it('defaults to "access content" when no permission configured', () => {
    const plugin = new PermissionAccess();
    expect(plugin.access(account(['access content'])).isAllowed()).toBe(true);
  });
});
