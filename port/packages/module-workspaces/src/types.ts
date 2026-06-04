/**
 * Public contracts and supporting types for the `workspaces` module port.
 *
 * Source: drupal-core/core/modules/workspaces/*
 *
 * The Workspaces module lets editors stage a collection of content changes in an
 * isolated "workspace" and publish them to the live site atomically. This port
 * ports the core vertical slice: the `workspace` content-entity definition, the
 * workspace manager (active-workspace negotiation + scoped execution), the
 * workspace-support information service, the access provider, the request
 * negotiators, the access control handler, and the entity-access hook
 * implementations registered via `@drupaljs/hook`.
 *
 * Deep collaborators (entity storage, the entity-type manager, the HTTP request
 * stack, the event dispatcher, sessions) are modelled here as minimal LOCAL
 * seam interfaces carrying TODO markers until the canonical `@drupaljs/*`
 * packages land and cross-package resolution is wired up.
 */

// ---------------------------------------------------------------------------
// Constants ported from config / yml
// ---------------------------------------------------------------------------

/**
 * The `workspaces` module's permissions, keyed by machine name.
 *
 * Source: drupal-core/core/modules/workspaces/workspaces.permissions.yml
 */
export const WORKSPACES_PERMISSIONS = {
  'administer workspaces': { title: 'Administer workspaces' },
  'create workspace': { title: 'Create a new workspace' },
  'view own workspace': { title: 'View own workspace' },
  'view any workspace': { title: 'View any workspace' },
  'edit own workspace': { title: 'Edit own workspace' },
  'edit any workspace': { title: 'Edit any workspace' },
  'delete own workspace': { title: 'Delete own workspace' },
  'delete any workspace': { title: 'Delete any workspace' },
  'bypass entity access own workspace': {
    title: 'Bypass content entity access in own workspace',
    description:
      'Allow all Edit/Update/Delete permissions for all content entities in a workspace owned by the user.',
    restrict: true,
  },
} as const;

/** A permission machine name defined by the workspaces module. */
export type WorkspacePermission = keyof typeof WORKSPACES_PERMISSIONS;

/**
 * Link relation types defined by the module.
 *
 * Source: drupal-core/core/modules/workspaces/workspaces.link_relation_types.yml
 */
export const WORKSPACES_LINK_RELATION_TYPES = ['workspace-publish'] as const;

/** This module's machine name. */
export const WORKSPACES_MODULE_NAME = 'workspaces';

/** The id of the `workspace` content-entity type. */
export const WORKSPACE_ENTITY_TYPE_ID = 'workspace';

/**
 * Validation pattern applied to a workspace id (the `value` property of `id`).
 *
 * Source: Workspace::baseFieldDefinitions() — Regex `/^[a-z0-9_]+$/`.
 */
export const WORKSPACE_ID_PATTERN = /^[a-z0-9_]+$/;

/** Maximum length of the workspace `id` / `label` / `provider` fields. */
export const WORKSPACE_MAX_LENGTH = 128;

// ---------------------------------------------------------------------------
// External seams (minimal). Replaced by canonical @drupaljs/* types later.
// ---------------------------------------------------------------------------

/**
 * Minimal account contract.
 *
 * Mirrors the surface of `Drupal\Core\Session\AccountInterface` the workspaces
 * module relies on.
 *
 * TODO(@drupaljs/session): import the canonical `AccountInterface`.
 */
export interface AccountLike {
  id(): number | string;
  isAuthenticated(): boolean;
  hasPermission(permission: string): boolean;
}

/**
 * The three possible outcomes of an access check, ported from
 * `Drupal\Core\Access\AccessResultInterface`.
 *
 * Modelled as a tiny tagged value rather than the full cacheable-metadata class;
 * `andIf` keeps the boolean-AND combination semantics the module relies on.
 *
 * TODO(@drupaljs/access): replace with the canonical `AccessResult`.
 */
export type AccessOutcome = 'allowed' | 'forbidden' | 'neutral';

export class AccessResult {
  private constructor(
    public readonly outcome: AccessOutcome,
    public readonly reason?: string,
  ) {}

  static allowed(): AccessResult {
    return new AccessResult('allowed');
  }

  static forbidden(reason?: string): AccessResult {
    return new AccessResult('forbidden', reason);
  }

  static neutral(): AccessResult {
    return new AccessResult('neutral');
  }

  /** Ports `AccessResult::allowedIf()`. */
  static allowedIf(condition: boolean): AccessResult {
    return condition ? AccessResult.allowed() : AccessResult.neutral();
  }

  /** Ports `AccessResult::forbiddenIf()`. */
  static forbiddenIf(condition: boolean, reason?: string): AccessResult {
    return condition ? AccessResult.forbidden(reason) : AccessResult.neutral();
  }

  /** Ports `AccessResult::allowedIfHasPermission()`. */
  static allowedIfHasPermission(account: AccountLike, permission: string): AccessResult {
    return AccessResult.allowedIf(account.hasPermission(permission));
  }

  /**
   * Ports `AccessResult::allowedIfHasPermissions(..., 'OR')` — allowed when the
   * account has at least one of the listed permissions.
   */
  static allowedIfHasAnyPermission(account: AccountLike, permissions: string[]): AccessResult {
    return AccessResult.allowedIf(permissions.some((p) => account.hasPermission(p)));
  }

  isAllowed(): boolean {
    return this.outcome === 'allowed';
  }

  isForbidden(): boolean {
    return this.outcome === 'forbidden';
  }

  isNeutral(): boolean {
    return this.outcome === 'neutral';
  }

  /**
   * Ports `AccessResultInterface::andIf()`: forbidden dominates, otherwise both
   * must be allowed for the combined result to be allowed.
   */
  andIf(other: AccessResult): AccessResult {
    if (this.isForbidden()) return this;
    if (other.isForbidden()) return other;
    if (this.isAllowed() && other.isAllowed()) return AccessResult.allowed();
    return AccessResult.neutral();
  }
}

/**
 * Minimal HTTP request seam — only the query bag the negotiators read.
 *
 * TODO(@drupaljs/http-kernel): replace with the canonical request type.
 */
export interface RequestLike {
  query: { get(key: string): string | null | undefined };
}

/**
 * Minimal request-stack seam.
 *
 * TODO(@drupaljs/http-kernel): replace with the canonical request stack.
 */
export interface RequestStackLike {
  getCurrentRequest(): RequestLike | null;
}

/**
 * Minimal session seam used by the session negotiator.
 *
 * TODO(@drupaljs/session): replace with the canonical session type.
 */
export interface SessionLike {
  get(key: string): string | null | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/**
 * Minimal entity-storage seam — loads a workspace entity by id.
 *
 * TODO(@drupaljs/entity): replace with the canonical storage interface.
 */
export interface WorkspaceStorageLike {
  load(id: string): WorkspaceLike | null;
}

/**
 * Minimal entity-type-manager seam — yields workspace storage on demand.
 *
 * TODO(@drupaljs/entity): replace with the canonical entity-type manager.
 */
export interface EntityTypeManagerLike {
  getStorage(entityTypeId: string): WorkspaceStorageLike;
}

/**
 * Minimal event-dispatcher seam.
 *
 * TODO(@drupaljs/event-dispatcher): replace with the canonical dispatcher.
 */
export interface EventDispatcherLike {
  dispatch(event: unknown): void;
}

/**
 * Minimal entity-type definition seam used by {@link WorkspaceInformation}.
 *
 * TODO(@drupaljs/entity): replace with the canonical `EntityTypeInterface`.
 */
export interface EntityTypeLike {
  id(): string;
  /** True if the entity type declares a `workspace` handler. */
  hasWorkspaceHandler(): boolean;
  /** The workspace handler class name, or null. */
  getWorkspaceHandlerClass(): string | null;
  /** Fallback heuristics when info hasn't been altered yet. */
  isPublishable(): boolean;
  isRevisionable(): boolean;
}

/**
 * Minimal content-entity seam — the surface the support check needs.
 *
 * TODO(@drupaljs/entity): replace with the canonical `EntityInterface`.
 */
export interface EntityLike {
  id(): number | string;
  getEntityTypeId(): string;
  getEntityType(): EntityTypeLike;
}

/**
 * Minimal workspace-entity seam used by the manager / provider / access checks.
 *
 * TODO(@drupaljs/entity): replace with the ported `Workspace` content entity.
 */
export interface WorkspaceLike {
  id(): string;
  label(): string;
  getOwnerId(): number | string;
  hasParent(): boolean;
  access(operation: string, account?: AccountLike): boolean;
}

/** Hook registrar seam — the slice of `@drupaljs/hook` we depend on. */
export interface HookRegistrarLike {
  implement(module: string, hook: string, callback: (...args: any[]) => unknown): void;
}
