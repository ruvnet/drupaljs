/**
 * The `workspace` content-entity type.
 *
 * Source: drupal-core/core/modules/workspaces/src/Entity/Workspace.php and
 * src/WorkspaceInterface.php.
 *
 * The PHP class is a `ContentEntityBase` decorated with a `#[ContentEntityType]`
 * attribute. This port models the same public contract (id / label / owner /
 * parent / provider / created / changed) as a plain value object plus a
 * declarative {@link WorkspaceEntityDefinition} describing the entity type, and
 * a {@link WORKSPACE_BASE_FIELD_DEFINITIONS} map describing the base fields. The
 * heavy `postSave` / `preDelete` lifecycle (revision purging, association
 * copying) belongs to the storage/cron layer and is intentionally out of this
 * vertical slice (see the TODO markers in WorkspaceManager / hooks).
 */

import {
  type AccountLike,
  type WorkspaceLike,
  WORKSPACE_ENTITY_TYPE_ID,
  WORKSPACE_ID_PATTERN,
  WORKSPACE_MAX_LENGTH,
} from './types.js';

/** The default workspace provider id. Ports `DefaultWorkspaceProvider::getId()`. */
export const DEFAULT_WORKSPACE_PROVIDER_ID = 'default';

/** A base-field description (port-minimal projection of `BaseFieldDefinition`). */
export interface WorkspaceBaseFieldDefinition {
  type: string;
  label: string;
  required?: boolean;
  revisionable?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  targetType?: string;
  defaultValue?: string;
  constraints?: string[];
}

/**
 * The workspace base-field definitions.
 *
 * Source: `Workspace::baseFieldDefinitions()`.
 */
export const WORKSPACE_BASE_FIELD_DEFINITIONS: Record<string, WorkspaceBaseFieldDefinition> = {
  id: {
    type: 'string',
    label: 'Workspace ID',
    maxLength: WORKSPACE_MAX_LENGTH,
    required: true,
    // ->addConstraint('UniqueField')->addConstraint('DeletedWorkspace')
    // ->addPropertyConstraints('value', ['Regex' => ...])
    constraints: ['UniqueField', 'DeletedWorkspace', 'Regex'],
  },
  label: {
    type: 'string',
    label: 'Workspace name',
    revisionable: true,
    maxLength: WORKSPACE_MAX_LENGTH,
    required: true,
  },
  uid: {
    type: 'entity_reference',
    label: 'Owner',
    targetType: 'user',
  },
  parent: {
    type: 'entity_reference',
    label: 'Parent',
    targetType: WORKSPACE_ENTITY_TYPE_ID,
    readOnly: true,
  },
  provider: {
    type: 'string',
    label: 'Provider',
    maxLength: WORKSPACE_MAX_LENGTH,
    required: true,
    readOnly: true,
    defaultValue: DEFAULT_WORKSPACE_PROVIDER_ID,
  },
  changed: { type: 'changed', label: 'Changed', revisionable: true },
  created: { type: 'created', label: 'Created' },
};

/**
 * The `#[ContentEntityType]` definition, ported as a plain descriptor.
 *
 * Source: the attribute on `Workspace`.
 */
export const WorkspaceEntityDefinition = {
  id: WORKSPACE_ENTITY_TYPE_ID,
  label: 'Workspace',
  labelCollection: 'Workspaces',
  labelSingular: 'workspace',
  labelPlural: 'workspaces',
  entityKeys: {
    id: 'id',
    revision: 'revision_id',
    uuid: 'uuid',
    label: 'label',
    uid: 'uid',
    owner: 'uid',
  },
  handlers: {
    access: 'WorkspaceAccessControlHandler',
    workspace: 'IgnoredWorkspaceHandler',
  },
  adminPermission: 'administer workspaces' as const,
  baseTable: 'workspace',
  dataTable: 'workspace_field_data',
  revisionTable: 'workspace_revision',
  revisionDataTable: 'workspace_field_revision',
} as const;

/** True when `id` matches the workspace id pattern (`/^[a-z0-9_]+$/`). */
export function isValidWorkspaceId(id: string): boolean {
  return WORKSPACE_ID_PATTERN.test(id);
}

/** The mutable field values a {@link Workspace} is constructed from. */
export interface WorkspaceValues {
  id: string;
  label: string;
  uid: number | string;
  parent?: string | null;
  provider?: string;
  created?: number;
  changed?: number;
}

/** Delegated access check, mirroring `EntityInterface::access()`. */
export type WorkspaceAccessChecker = (operation: string, account?: AccountLike) => boolean;

/**
 * The workspace entity value object.
 *
 * Ports the `WorkspaceInterface` accessors. `publish()` and the storage
 * lifecycle hooks are delegated to other services in Drupal; here `access()` is
 * delegated to an injectable checker (set by the access control handler /
 * provider) so the entity stays free of a service-locator dependency.
 */
export class Workspace implements WorkspaceLike {
  private readonly values: WorkspaceValues;
  private accessChecker: WorkspaceAccessChecker = () => false;

  constructor(values: WorkspaceValues) {
    this.values = { provider: DEFAULT_WORKSPACE_PROVIDER_ID, ...values };
  }

  id(): string {
    return this.values.id;
  }

  label(): string {
    return this.values.label;
  }

  getOwnerId(): number | string {
    return this.values.uid;
  }

  /** Ports `WorkspaceInterface::getCreatedTime()`. */
  getCreatedTime(): number {
    return this.values.created ?? 0;
  }

  /** Ports `WorkspaceInterface::setCreatedTime()` (fluent). */
  setCreatedTime(created: number): this {
    this.values.created = created;
    return this;
  }

  /** Ports `WorkspaceInterface::hasParent()`. */
  hasParent(): boolean {
    return this.values.parent !== undefined && this.values.parent !== null && this.values.parent !== '';
  }

  /** The parent workspace id, or null. */
  getParentId(): string | null {
    return this.values.parent ?? null;
  }

  /**
   * The provider id. Ports `getProvider()` minus the provider-collector lookup
   * (the collector lives in `provider.ts`).
   */
  getProviderId(): string {
    return this.values.provider ?? DEFAULT_WORKSPACE_PROVIDER_ID;
  }

  /** Injects the access checker used by {@link access}. */
  setAccessChecker(checker: WorkspaceAccessChecker): this {
    this.accessChecker = checker;
    return this;
  }

  /** Ports `EntityInterface::access()` via the injected checker. */
  access(operation: string, account?: AccountLike): boolean {
    return this.accessChecker(operation, account);
  }
}
