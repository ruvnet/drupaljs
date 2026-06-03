import { describe, it, expect, vi } from 'vitest';
import { User } from './user.js';
import type { PermissionCheckerInterface } from '../types.js';

describe('User content entity — identity', () => {
  it('uid 0 is anonymous, uid > 0 is authenticated', () => {
    const anon = new User({ uid: 0 });
    expect(anon.id()).toBe(0);
    expect(anon.isAnonymous()).toBe(true);
    expect(anon.isAuthenticated()).toBe(false);

    const auth = new User({ uid: 7 });
    expect(auth.isAnonymous()).toBe(false);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('defaults to anonymous when no uid given', () => {
    expect(new User().isAnonymous()).toBe(true);
  });
});

describe('User content entity — roles', () => {
  it('prepends the locked authenticated role for authenticated users', () => {
    const u = new User({ uid: 3, roles: ['editor'] });
    expect(u.getRoles()).toEqual(['authenticated', 'editor']);
    expect(u.getRoles(true)).toEqual(['editor']);
    expect(u.hasRole('authenticated')).toBe(true);
    expect(u.hasRole('editor')).toBe(true);
  });

  it('prepends the anonymous role for the anonymous user', () => {
    expect(new User({ uid: 0 }).getRoles()).toEqual(['anonymous']);
  });

  it('addRole rejects the locked roles', () => {
    const u = new User({ uid: 1 });
    expect(() => u.addRole('authenticated')).toThrow(/must not be assigned manually/);
    expect(() => u.addRole('anonymous')).toThrow(/must not be assigned manually/);
  });

  it('addRole de-duplicates and removeRole removes', () => {
    const u = new User({ uid: 1 });
    u.addRole('editor').addRole('editor').addRole('admin');
    expect(u.getRoles(true).sort()).toEqual(['admin', 'editor']);
    u.removeRole('editor');
    expect(u.getRoles(true)).toEqual(['admin']);
  });
});

describe('User content entity — status', () => {
  it('is active by default and can be blocked / reactivated', () => {
    const u = new User({ uid: 2 });
    expect(u.isActive()).toBe(true);
    expect(u.isBlocked()).toBe(false);
    u.block();
    expect(u.isBlocked()).toBe(true);
    u.activate();
    expect(u.isActive()).toBe(true);
  });

  it('refuses to activate the anonymous user', () => {
    const anon = new User({ uid: 0 });
    expect(() => anon.activate()).toThrow(/anonymous user account should remain blocked/);
  });
});

describe('User content entity — fields', () => {
  it('round-trips name, email and password', () => {
    const u = new User({ uid: 1, name: 'ada', mail: 'ada@example.com', pass: 'h' });
    expect(u.getAccountName()).toBe('ada');
    expect(u.getEmail()).toBe('ada@example.com');
    expect(u.getPassword()).toBe('h');
    u.setUsername('grace').setEmail('grace@example.com').setPassword('h2');
    expect(u.getAccountName()).toBe('grace');
    expect(u.getEmail()).toBe('grace@example.com');
    expect(u.getPassword()).toBe('h2');
  });
});

describe('User content entity — hasPermission delegation (London-style)', () => {
  it('delegates to the injected permission checker with itself as the account', () => {
    const checker: PermissionCheckerInterface = {
      hasPermission: vi.fn().mockReturnValue(true),
    };
    const u = new User({ uid: 5 }, checker);
    expect(u.hasPermission('administer users')).toBe(true);
    expect(checker.hasPermission).toHaveBeenCalledWith('administer users', u);
  });

  it('throws when no checker is wired', () => {
    expect(() => new User({ uid: 5 }).hasPermission('x')).toThrow(
      /requires a PermissionChecker/,
    );
  });
});
