import { describe, it, expect } from 'vitest';
import {
  SessionWorkspaceNegotiator,
  QueryParameterWorkspaceNegotiator,
} from './negotiator.js';
import type { AccountLike, RequestLike, SessionLike, WorkspaceLike } from './types.js';

function session(initial: Record<string, string> = {}): SessionLike & { store: Record<string, string> } {
  const store = { ...initial };
  return {
    store,
    get: (k) => store[k] ?? null,
    set: (k, v) => {
      store[k] = v;
    },
    remove: (k) => {
      delete store[k];
    },
  };
}

const account = (authenticated: boolean): AccountLike => ({
  id: () => 1,
  isAuthenticated: () => authenticated,
  hasPermission: () => false,
});

const request = (query: Record<string, string> = {}): RequestLike => ({
  query: { get: (k) => query[k] ?? null },
});

const ws = (id: string): WorkspaceLike => ({
  id: () => id,
  label: () => id,
  getOwnerId: () => 1,
  hasParent: () => false,
  access: () => true,
});

describe('SessionWorkspaceNegotiator', () => {
  it('applies only for authenticated users', () => {
    const s = session();
    expect(new SessionWorkspaceNegotiator(account(true), s).applies(request())).toBe(true);
    expect(new SessionWorkspaceNegotiator(account(false), s).applies(request())).toBe(false);
  });

  it('reads / writes / clears the active workspace id in the session', () => {
    const s = session({ active_workspace_id: 'stage' });
    const n = new SessionWorkspaceNegotiator(account(true), s);
    expect(n.getActiveWorkspaceId(request())).toBe('stage');

    n.setActiveWorkspace(ws('dev'));
    expect(s.store.active_workspace_id).toBe('dev');

    n.unsetActiveWorkspace();
    expect(s.store.active_workspace_id).toBeUndefined();
  });
});

describe('QueryParameterWorkspaceNegotiator', () => {
  // A fixed token function lets us assert token validation deterministically.
  const tokenFor = (id: string) => `tok-${id}`;

  function makeNegotiator(authenticated = true) {
    return new QueryParameterWorkspaceNegotiator(account(authenticated), session(), tokenFor);
  }

  it('applies only when workspace + token query params are present and user is authenticated', () => {
    const n = makeNegotiator();
    expect(n.applies(request({ workspace: 'stage', token: 'tok-stage' }))).toBe(true);
    expect(n.applies(request({ workspace: 'stage' }))).toBe(false);
    expect(makeNegotiator(false).applies(request({ workspace: 'stage', token: 'tok-stage' }))).toBe(false);
  });

  it('returns the workspace id only when the token matches', () => {
    const n = makeNegotiator();
    expect(n.getActiveWorkspaceId(request({ workspace: 'stage', token: 'tok-stage' }))).toBe('stage');
    expect(n.getActiveWorkspaceId(request({ workspace: 'stage', token: 'wrong' }))).toBeNull();
  });

  it('produces query options carrying the workspace id and its token', () => {
    const n = makeNegotiator();
    expect(n.getQueryOptions('stage')).toEqual({ workspace: 'stage', token: 'tok-stage' });
  });
});
