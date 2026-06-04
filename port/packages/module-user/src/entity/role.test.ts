import { describe, it, expect } from 'vitest';
import { Role } from './role.js';

describe('Role config entity', () => {
  it('exposes id, label (defaulting to id) and weight', () => {
    const r = new Role({ id: 'editor' });
    expect(r.id()).toBe('editor');
    expect(r.label()).toBe('editor');
    expect(r.getWeight()).toBe(0);

    const r2 = new Role({ id: 'editor', label: 'Editor', weight: 5 });
    expect(r2.label()).toBe('Editor');
    expect(r2.getWeight()).toBe(5);
    expect(r2.setWeight(10).getWeight()).toBe(10);
  });

  it('de-duplicates permissions on construction', () => {
    const r = new Role({ id: 'a', permissions: ['x', 'x', 'y'] });
    expect(r.getPermissions().sort()).toEqual(['x', 'y']);
  });

  it('grants and revokes permissions idempotently', () => {
    const r = new Role({ id: 'a' });
    r.grantPermission('access user profiles');
    r.grantPermission('access user profiles');
    expect(r.getPermissions()).toEqual(['access user profiles']);
    expect(r.hasPermission('access user profiles')).toBe(true);

    r.revokePermission('access user profiles');
    expect(r.hasPermission('access user profiles')).toBe(false);
    expect(r.getPermissions()).toEqual([]);
  });

  it('admin roles implicitly have all permissions and report no explicit ones', () => {
    const r = new Role({ id: 'admin', permissions: ['x'], is_admin: true });
    expect(r.isAdmin()).toBe(true);
    expect(r.hasPermission('anything at all')).toBe(true);
    expect(r.getPermissions()).toEqual([]);
    // grant/revoke are no-ops on an admin role.
    r.grantPermission('y');
    r.revokePermission('x');
    expect(r.hasPermission('still anything')).toBe(true);
  });

  it('exposes locked role ID constants', () => {
    expect(Role.ANONYMOUS_ID).toBe('anonymous');
    expect(Role.AUTHENTICATED_ID).toBe('authenticated');
  });
});
