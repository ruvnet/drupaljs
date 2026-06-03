import { describe, it, expect, vi } from 'vitest';
import {
  AccessResult,
  ContactFormAccessControlHandler,
  ContactPageAccess,
  type AccessAccount,
  type ContactAccount,
  type ContactSettings,
} from './contact-access.js';
import { ContactForm } from './contact-form.entity.js';

function account(perms: string[] = [], id: number | string = 1): AccessAccount {
  return {
    id: () => id,
    hasPermission: (p: string) => perms.includes(p),
  };
}

function contactAccount(
  overrides: Partial<{
    id: number | string;
    perms: string[];
    anonymous: boolean;
    blocked: boolean;
  }> = {},
): ContactAccount {
  const perms = overrides.perms ?? [];
  return {
    id: () => overrides.id ?? 2,
    hasPermission: (p: string) => perms.includes(p),
    isAnonymous: () => overrides.anonymous ?? false,
    isBlocked: () => overrides.blocked ?? false,
  };
}

describe('ContactFormAccessControlHandler', () => {
  const handler = new ContactFormAccessControlHandler();

  it('allows viewing a site form with the site-wide permission', () => {
    const result = handler.checkAccess(
      new ContactForm({ id: 'feedback' }),
      'view',
      account(['access site-wide contact form']),
    );
    expect(result.isAllowed()).toBe(true);
  });

  it('never allows viewing the personal form via the site-wide route', () => {
    const result = handler.checkAccess(
      new ContactForm({ id: 'personal' }),
      'view',
      account(['access site-wide contact form']),
    );
    expect(result.isAllowed()).toBe(false);
  });

  it('allows updating/deleting a non-personal form with the admin permission', () => {
    const acct = account(['administer contact forms']);
    const form = new ContactForm({ id: 'feedback' });
    expect(handler.checkAccess(form, 'update', acct).isAllowed()).toBe(true);
    expect(handler.checkAccess(form, 'delete', acct).isAllowed()).toBe(true);
  });

  it('never allows deleting the personal form even for admins', () => {
    const result = handler.checkAccess(
      new ContactForm({ id: 'personal' }),
      'delete',
      account(['administer contact forms']),
    );
    expect(result.isAllowed()).toBe(false);
  });

  it('denies update without the admin permission', () => {
    const result = handler.checkAccess(
      new ContactForm({ id: 'feedback' }),
      'update',
      account([]),
    );
    expect(result.isAllowed()).toBe(false);
  });
});

describe('ContactPageAccess', () => {
  const enabledByDefault: ContactSettings = { userDefaultEnabled: true };
  const disabledByDefault: ContactSettings = { userDefaultEnabled: false };

  it('forbids contacting an anonymous user', () => {
    const access = new ContactPageAccess(enabledByDefault, () => undefined);
    const result = access.access(contactAccount({ anonymous: true }), account());
    expect(result.isForbidden()).toBe(true);
  });

  it('returns neutral when contacting yourself', () => {
    const access = new ContactPageAccess(enabledByDefault, () => undefined);
    const result = access.access(contactAccount({ id: 1 }), account([], 1));
    expect(result.isAllowed()).toBe(false);
    expect(result.isForbidden()).toBe(false);
  });

  it('allows user administrators regardless of preferences', () => {
    const access = new ContactPageAccess(disabledByDefault, () => false);
    const result = access.access(
      contactAccount({ id: 2 }),
      account(['administer users'], 1),
    );
    expect(result.isAllowed()).toBe(true);
  });

  it('denies contacting a blocked user', () => {
    const access = new ContactPageAccess(enabledByDefault, () => undefined);
    const result = access.access(contactAccount({ id: 2, blocked: true }), account([], 1));
    expect(result.isAllowed()).toBe(false);
  });

  it('denies when the target explicitly disabled their contact form', () => {
    const userData = vi.fn(() => false);
    const access = new ContactPageAccess(enabledByDefault, userData);
    const result = access.access(contactAccount({ id: 2 }), account([], 1));
    expect(result.isAllowed()).toBe(false);
    expect(userData).toHaveBeenCalledWith(2);
  });

  it('denies when no preference is saved and the site default is disabled', () => {
    const access = new ContactPageAccess(disabledByDefault, () => undefined);
    const result = access.access(contactAccount({ id: 2 }), account([], 1));
    expect(result.isAllowed()).toBe(false);
  });

  it('allows when target enabled their form and the requester has the permission', () => {
    const access = new ContactPageAccess(disabledByDefault, () => true);
    const result = access.access(
      contactAccount({ id: 2 }),
      account(['access user contact forms'], 1),
    );
    expect(result.isAllowed()).toBe(true);
  });

  it('falls back to the site default (enabled) and requires the permission', () => {
    const access = new ContactPageAccess(enabledByDefault, () => undefined);
    const allowed = access.access(
      contactAccount({ id: 2 }),
      account(['access user contact forms'], 1),
    );
    expect(allowed.isAllowed()).toBe(true);
    const denied = access.access(contactAccount({ id: 2 }), account([], 1));
    expect(denied.isAllowed()).toBe(false);
  });
});

describe('AccessResult combinators', () => {
  it('andIf requires both to allow', () => {
    expect(AccessResult.allowed().andIf(AccessResult.allowed()).isAllowed()).toBe(true);
    expect(AccessResult.allowed().andIf(AccessResult.neutral()).isAllowed()).toBe(false);
  });

  it('orIf allows when either allows', () => {
    expect(AccessResult.neutral().orIf(AccessResult.allowed()).isAllowed()).toBe(true);
    expect(AccessResult.neutral().orIf(AccessResult.neutral()).isAllowed()).toBe(false);
  });
});
