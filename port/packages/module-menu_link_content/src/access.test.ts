import { describe, it, expect, vi } from 'vitest';
import { MenuLinkContentAccessControlHandler } from './access.js';
import { MenuLinkContent } from './entity.js';
import type { AccountInterface, AccessManagerInterface } from './types.js';

function account(perms: string[]): AccountInterface {
  const set = new Set(perms);
  return { hasPermission: (p) => set.has(p) };
}

function handler(accessManager?: AccessManagerInterface) {
  const am: AccessManagerInterface = accessManager ?? { checkNamedRoute: vi.fn(() => true) };
  return new MenuLinkContentAccessControlHandler(am);
}

describe('MenuLinkContentAccessControlHandler', () => {
  it('view requires the administer menu permission', () => {
    const e = MenuLinkContent.create({ id: 1, title: 'X', link: { uri: 'https://x.test' } });
    expect(handler().checkAccess(e, 'view', account(['administer menu']))).toBe('allowed');
    expect(handler().checkAccess(e, 'view', account([]))).toBe('neutral');
  });

  it('update is neutral without administer menu', () => {
    const e = MenuLinkContent.create({ id: 1, title: 'X', link: { uri: 'https://x.test' } });
    expect(handler().checkAccess(e, 'update', account([]))).toBe('neutral');
  });

  it('update on an external link is allowed with administer menu (no route check)', () => {
    const e = MenuLinkContent.create({ id: 1, title: 'X', link: { uri: 'https://x.test' } });
    expect(handler().checkAccess(e, 'update', account(['administer menu']))).toBe('allowed');
  });

  it('update on a routed link also requires route access unless "link to any page"', () => {
    const e = MenuLinkContent.create({ id: 1, title: 'X', link: { uri: 'internal:/secret' } });
    const am: AccessManagerInterface = { checkNamedRoute: vi.fn(() => false) };
    // administer menu but route access denied -> forbidden.
    expect(handler(am).checkAccess(e, 'update', account(['administer menu']))).toBe('forbidden');
    // "link to any page" bypasses the route check.
    expect(handler(am).checkAccess(e, 'update', account(['administer menu', 'link to any page']))).toBe(
      'allowed',
    );
  });

  it('delete requires administer menu and a non-new entity', () => {
    const saved = MenuLinkContent.create({ id: 7, title: 'S', link: { uri: 'https://s.test' } });
    const unsaved = MenuLinkContent.create({ title: 'U', link: { uri: 'https://u.test' } });
    expect(handler().checkAccess(saved, 'delete', account(['administer menu']))).toBe('allowed');
    expect(handler().checkAccess(unsaved, 'delete', account(['administer menu']))).toBe('forbidden');
    expect(handler().checkAccess(saved, 'delete', account([]))).toBe('neutral');
  });
});
