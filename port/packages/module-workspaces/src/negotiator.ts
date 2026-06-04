/**
 * Workspace request negotiators.
 *
 * Source: drupal-core/core/modules/workspaces/src/Negotiator/*.
 *
 * A negotiator determines (and can persist) the active workspace for the current
 * request. This slice ports the `SessionWorkspaceNegotiator` (session-backed) and
 * the `QueryParameterWorkspaceNegotiator` (token-validated `?workspace=&token=`),
 * plus the negotiator contracts.
 */

import {
  type AccountLike,
  type RequestLike,
  type SessionLike,
  type WorkspaceLike,
} from './types.js';

/** Session key under which the active workspace id is stored. */
export const SESSION_ACTIVE_WORKSPACE_KEY = 'active_workspace_id';

/**
 * Base negotiator contract.
 *
 * Ports `WorkspaceNegotiatorInterface` (+ `WorkspaceIdNegotiatorInterface`).
 */
export interface WorkspaceNegotiatorInterface {
  applies(request: RequestLike | null): boolean;
  getActiveWorkspaceId(request: RequestLike | null): string | null;
  setActiveWorkspace(workspace: WorkspaceLike): void;
  unsetActiveWorkspace(): void;
}

/**
 * Session-backed negotiator.
 *
 * Ports `SessionWorkspaceNegotiator`: applies for authenticated users and
 * persists the active workspace id in the session.
 */
export class SessionWorkspaceNegotiator implements WorkspaceNegotiatorInterface {
  constructor(
    protected readonly currentUser: AccountLike,
    protected readonly session: SessionLike,
  ) {}

  applies(_request: RequestLike | null): boolean {
    return this.currentUser.isAuthenticated();
  }

  getActiveWorkspaceId(_request: RequestLike | null): string | null {
    return this.session.get(SESSION_ACTIVE_WORKSPACE_KEY) ?? null;
  }

  setActiveWorkspace(workspace: WorkspaceLike): void {
    this.session.set(SESSION_ACTIVE_WORKSPACE_KEY, workspace.id());
  }

  unsetActiveWorkspace(): void {
    this.session.remove(SESSION_ACTIVE_WORKSPACE_KEY);
  }
}

/**
 * Computes a short token for a workspace id.
 *
 * In Drupal this is `substr(Crypt::hmacBase64($id, hashSalt), 0, 8)`. The HMAC
 * primitive belongs to the (Rust/WASM) crypto crate per ADR-0015, so this port
 * accepts the token function by injection.
 *
 * TODO(@drupaljs/crypt): default to the canonical HMAC-base64 implementation.
 */
export type WorkspaceTokenFn = (workspaceId: string) => string;

/**
 * Query-parameter negotiator.
 *
 * Ports `QueryParameterWorkspaceNegotiator`: applies only when both `workspace`
 * and `token` query params are present (and the user is authenticated), and
 * returns the workspace id only when the supplied token matches the computed
 * one. Extends the session negotiator for persistence.
 */
export class QueryParameterWorkspaceNegotiator extends SessionWorkspaceNegotiator {
  private persist = true;

  constructor(
    currentUser: AccountLike,
    session: SessionLike,
    private readonly tokenFn: WorkspaceTokenFn,
  ) {
    super(currentUser, session);
  }

  override applies(request: RequestLike | null): boolean {
    if (!request) return false;
    const workspace = request.query.get('workspace');
    const token = request.query.get('token');
    return typeof workspace === 'string' && typeof token === 'string' && super.applies(request);
  }

  override getActiveWorkspaceId(request: RequestLike | null): string | null {
    if (!request) return null;
    const persistParam = request.query.get('persist');
    this.persist = persistParam === null || persistParam === undefined ? true : persistParam !== '0' && persistParam !== 'false';

    const workspaceId = String(request.query.get('workspace') ?? '');
    const token = String(request.query.get('token') ?? '');
    const isValid = this.constantTimeEquals(this.getQueryToken(workspaceId), token);
    return isValid ? workspaceId : null;
  }

  override setActiveWorkspace(workspace: WorkspaceLike): void {
    if (this.persist) {
      super.setActiveWorkspace(workspace);
    }
  }

  override unsetActiveWorkspace(): void {
    if (this.persist) {
      super.unsetActiveWorkspace();
    }
  }

  /** Ports `getQueryOptions()` — the query options for a workspace URL. */
  getQueryOptions(workspaceId: string): { workspace: string; token: string } {
    return { workspace: workspaceId, token: this.getQueryToken(workspaceId) };
  }

  private getQueryToken(workspaceId: string): string {
    return this.tokenFn(workspaceId);
  }

  /** Length-safe equality to mirror PHP's `hash_equals`. */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
}
