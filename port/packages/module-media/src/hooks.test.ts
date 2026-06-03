import { describe, it, expect, vi } from 'vitest';
import { registerMediaHooks, mediaEntityAccess, mediaHelp } from './hooks.js';
import type { HookRegistrar, MediaInterface, AccountInterface } from './contracts.js';

describe('registerMediaHooks', () => {
  it('registers help and entity-access hook implementations for the media module', () => {
    const calls: Array<[string, string]> = [];
    const registrar: HookRegistrar = {
      implement: vi.fn((module: string, hook: string) => {
        calls.push([module, hook]);
      }),
    };
    registerMediaHooks(registrar);
    expect(registrar.implement).toHaveBeenCalled();
    const hooks = calls.filter(([m]) => m === 'media').map(([, h]) => h);
    expect(hooks).toContain('help');
    expect(hooks).toContain('media_access');
  });
});

describe('mediaHelp hook', () => {
  it('returns help text for the media admin overview route', () => {
    expect(mediaHelp('help.page.media')).toMatch(/media/i);
    expect(mediaHelp('some.other.route')).toBeNull();
  });
});

describe('mediaEntityAccess hook', () => {
  function media(bundle: string, owner: number, published: boolean): MediaInterface {
    return {
      id: () => 1,
      uuid: () => 'u',
      bundle: () => bundle,
      getOwnerId: () => owner,
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
  function account(id: number, perms: string[]): AccountInterface {
    const set = new Set(perms);
    return { id: () => id, hasPermission: (p) => set.has(p) };
  }

  it('delegates the media_access hook to the access control handler', () => {
    const result = mediaEntityAccess(media('image', 2, true), 'view', account(2, ['view media']));
    expect(result.isAllowed()).toBe(true);
  });
});
