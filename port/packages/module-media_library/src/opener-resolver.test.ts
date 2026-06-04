import { describe, it, expect, vi } from 'vitest';
import { OpenerResolver } from './opener-resolver.js';
import { MediaLibraryState } from './media-library-state.js';
import { AccessResult } from './access-result.js';
import type { HashSigner, MediaLibraryOpenerInterface } from './index.js';

const signer: HashSigner = { sign: (d) => `sig(${d})` };

const makeOpener = (): MediaLibraryOpenerInterface => ({
  checkAccess: vi.fn(() => AccessResult.allowed()),
  getSelectionResponse: vi.fn((_state, ids) => ({ selected: ids })),
});

const stateFor = (openerId: string) =>
  MediaLibraryState.create(openerId, ['image'], 'image', 1, {}, signer);

describe('OpenerResolver', () => {
  it('resolves a registered opener by the state opener id', () => {
    const resolver = new OpenerResolver();
    const opener = makeOpener();
    resolver.addOpener(opener, 'opener.a');
    expect(resolver.get(stateFor('opener.a'))).toBe(opener);
  });

  it('throws when no opener is registered for the id', () => {
    const resolver = new OpenerResolver();
    expect(() => resolver.get(stateFor('missing'))).toThrow(/missing/);
  });

  it('lets the resolved opener answer access + selection', () => {
    const resolver = new OpenerResolver();
    const opener = makeOpener();
    resolver.addOpener(opener, 'opener.a');
    const state = stateFor('opener.a');
    const account = { id: () => 1, hasPermission: () => true };

    const resolved = resolver.get(state);
    expect(resolved.checkAccess(state, account).isAllowed()).toBe(true);
    expect(resolved.getSelectionResponse(state, [10, 20])).toEqual({ selected: [10, 20] });
  });
});
