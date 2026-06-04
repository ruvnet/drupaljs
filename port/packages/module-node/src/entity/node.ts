/**
 * Port of `Drupal\node\Entity\Node` and `Drupal\node\NodeInterface`.
 *
 * Node is the content entity. The generic ContentEntity machinery (field API,
 * storage, revisions table) lives in the entity subsystem and is out of scope;
 * this models the node-specific behavioural surface plus the fields the access
 * handler and hooks read (type, title, owner, status flags, timestamps).
 */

/** Published-status constants. Ports NodeInterface::PUBLISHED / NOT_PUBLISHED. */
export const NodePublishStatus = {
  NOT_PUBLISHED: 0,
  PUBLISHED: 1,
} as const;

/** Promotion-status constants. Ports NodeInterface::PROMOTED / NOT_PROMOTED. */
export const NodePromoteStatus = {
  NOT_PROMOTED: 0,
  PROMOTED: 1,
} as const;

/** Sticky-status constants. Ports NodeInterface::STICKY / NOT_STICKY. */
export const NodeStickyStatus = {
  NOT_STICKY: 0,
  STICKY: 1,
} as const;

/** Constructor values for a {@link Node}. Mirrors node base-field defaults. */
export interface NodeValues {
  /** Numeric id (nid). */
  nid: number;
  /** Bundle / content type machine name. */
  type: string;
  /** Title (label). May be absent for an unsaved preview. */
  title?: string | null;
  /** Owner user id (uid). */
  uid: number;
  /** Published flag. Drupal default: published. */
  status?: boolean;
  /** Promoted-to-front-page flag. Drupal default: not promoted. */
  promote?: boolean;
  /** Sticky-at-top flag. Drupal default: not sticky. */
  sticky?: boolean;
  /** Creation timestamp. */
  created?: number;
  /** Revision creation timestamp. */
  revision_timestamp?: number;
  /** Whether this object is the default (current) revision. Default: true. */
  default_revision?: boolean;
}

/**
 * Interface defining a node entity. Ports the bespoke methods of
 * `Drupal\node\NodeInterface`. Mixin interfaces (EntityOwner, EntityPublished,
 * RevisionLog, EntityChanged) are folded in as the methods actually consumed.
 */
export interface NodeInterface {
  id(): number;
  bundle(): string;
  getType(): string;
  getTitle(): string | null;
  setTitle(title: string): this;
  getOwnerId(): number;
  getCreatedTime(): number;
  setCreatedTime(timestamp: number): this;
  isPublished(): boolean;
  setPublished(published?: boolean): this;
  isPromoted(): boolean;
  setPromoted(promoted: boolean): this;
  isSticky(): boolean;
  setSticky(sticky: boolean): this;
  getRevisionCreationTime(): number;
  setRevisionCreationTime(timestamp: number): this;
  isDefaultRevision(): boolean;
}

export class Node implements NodeInterface {
  private readonly nid: number;
  private readonly type: string;
  private title: string | null;
  private readonly uid: number;
  private status: boolean;
  private promote: boolean;
  private sticky: boolean;
  private created: number;
  private revisionTimestamp: number;
  private readonly defaultRevision: boolean;

  /**
   * Whether the node is being previewed. Ports the public `$in_preview` field.
   */
  public inPreview = false;

  constructor(values: NodeValues) {
    this.nid = values.nid;
    this.type = values.type;
    this.title = values.title ?? null;
    this.uid = values.uid;
    this.status = values.status ?? true;
    this.promote = values.promote ?? false;
    this.sticky = values.sticky ?? false;
    this.created = values.created ?? 0;
    this.revisionTimestamp = values.revision_timestamp ?? 0;
    this.defaultRevision = values.default_revision ?? true;
  }

  id(): number {
    return this.nid;
  }

  bundle(): string {
    return this.type;
  }

  getType(): string {
    return this.type;
  }

  getTitle(): string | null {
    return this.title;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  getOwnerId(): number {
    return this.uid;
  }

  getCreatedTime(): number {
    return this.created;
  }

  setCreatedTime(timestamp: number): this {
    this.created = timestamp;
    return this;
  }

  isPublished(): boolean {
    return this.status;
  }

  setPublished(published = true): this {
    this.status = published;
    return this;
  }

  isPromoted(): boolean {
    return this.promote;
  }

  setPromoted(promoted: boolean): this {
    this.promote = promoted;
    return this;
  }

  isSticky(): boolean {
    return this.sticky;
  }

  setSticky(sticky: boolean): this {
    this.sticky = sticky;
    return this;
  }

  getRevisionCreationTime(): number {
    return this.revisionTimestamp;
  }

  setRevisionCreationTime(timestamp: number): this {
    this.revisionTimestamp = timestamp;
    return this;
  }

  isDefaultRevision(): boolean {
    return this.defaultRevision;
  }
}
