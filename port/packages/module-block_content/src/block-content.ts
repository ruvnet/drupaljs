/**
 * Port of `Drupal\block_content\Entity\BlockContent` — the content block
 * entity. A faithful but minimal slice: the editorial/revisionable field set is
 * modelled as plain typed properties (the full field/typed-data system lives in
 * other packages), with the behaviour-bearing methods (`setInfo`, reusable
 * flags, `theme`, `createDuplicate`, instance lookup) ported directly.
 *
 * @see drupal-core/core/modules/block_content/src/Entity/BlockContent.php
 */

import { BLOCK_CONTENT_ENTITY_TYPE } from './block-content-type.js';

/**
 * Entity keys for `block_content`, mirroring the `#[ContentEntityType]`
 * `entity_keys` map.
 */
export const BLOCK_CONTENT_ENTITY_KEYS = {
  id: 'id',
  revision: 'revision_id',
  bundle: 'type',
  label: 'info',
  langcode: 'langcode',
  uuid: 'uuid',
  published: 'status',
} as const;

/**
 * The base-field definitions added/overridden by
 * `BlockContent::baseFieldDefinitions()`. Modelled as metadata so consumers
 * (form, storage schema, views) can introspect without the full field system.
 */
export const BLOCK_CONTENT_BASE_FIELDS = {
  info: {
    type: 'string',
    label: 'Block description',
    required: true,
    revisionable: true,
    translatable: true,
  },
  changed: { type: 'changed', label: 'Changed', revisionable: true, translatable: true },
  reusable: {
    type: 'boolean',
    label: 'Reusable',
    revisionable: false,
    translatable: false,
    defaultValue: true,
  },
} as const;

export interface BlockContentValues {
  id?: number | null;
  uuid?: string;
  type: string;
  info?: string;
  langcode?: string;
  /** Published flag (entity_keys.published === 'status'). */
  status?: boolean;
  reusable?: boolean;
  revisionId?: number | null;
  revisionLogMessage?: string | null;
}

/**
 * A loader for a block's placed plugin instances. The real entity calls
 * `entityTypeManager.getStorage('block').loadByProperties(...)`; we inject the
 * dependency so the slice stays decoupled from the block/entity packages.
 *
 * TODO(@drupaljs/block): replace with the real block plugin storage lookup.
 */
export type InstanceLoader = (pluginId: string) => unknown[];

export class BlockContent {
  id: number | null;
  uuid: string;
  /** Bundle (entity_keys.bundle === 'type'). */
  readonly type: string;
  private info: string;
  langcode: string;
  private status: boolean;
  private reusable: boolean;
  revisionId: number | null;
  private revisionLogMessage: string | null;

  /** Transient: theme chosen in the block library add flow (not persisted). */
  private theme: string | null = null;

  private readonly instanceLoader: InstanceLoader;

  constructor(values: BlockContentValues, instanceLoader: InstanceLoader = () => []) {
    if (!values.type) {
      throw new Error('A block_content requires a "type" (bundle).');
    }
    this.id = values.id ?? null;
    this.uuid = values.uuid ?? crypto.randomUUID();
    this.type = values.type;
    this.info = values.info ?? '';
    this.langcode = values.langcode ?? 'en';
    this.status = values.status ?? true;
    this.reusable = values.reusable ?? true;
    this.revisionId = values.revisionId ?? null;
    this.revisionLogMessage = values.revisionLogMessage ?? null;
    this.instanceLoader = instanceLoader;
  }

  bundle(): string {
    return this.type;
  }

  /** label key === 'info'. */
  label(): string {
    return this.info;
  }

  getInfo(): string {
    return this.info;
  }

  /** Ports BlockContentInterface::setInfo(). */
  setInfo(info: string): this {
    this.info = info;
    return this;
  }

  // -- Reusable --------------------------------------------------------------

  /** Ports isReusable(). */
  isReusable(): boolean {
    return this.reusable;
  }

  /** Ports setReusable(). */
  setReusable(): this {
    this.reusable = true;
    return this;
  }

  /** Ports setNonReusable(). */
  setNonReusable(): this {
    this.reusable = false;
    return this;
  }

  // -- Published (EntityPublishedInterface) ----------------------------------

  isPublished(): boolean {
    return this.status;
  }

  setPublished(): this {
    this.status = true;
    return this;
  }

  setUnpublished(): this {
    this.status = false;
    return this;
  }

  // -- Theme (transient) -----------------------------------------------------

  /** Ports setTheme(). */
  setTheme(theme: string): this {
    this.theme = theme;
    return this;
  }

  /** Ports getTheme(). */
  getTheme(): string | null {
    return this.theme;
  }

  // -- Revision log ----------------------------------------------------------

  getRevisionLogMessage(): string | null {
    return this.revisionLogMessage;
  }

  setRevisionLogMessage(message: string | null): this {
    this.revisionLogMessage = message;
    return this;
  }

  // -- Behaviour -------------------------------------------------------------

  /**
   * Ports createDuplicate(): clones the block but clears the identifiers so the
   * copy saves as a brand-new entity/revision.
   */
  createDuplicate(): BlockContent {
    const duplicate = new BlockContent(
      {
        type: this.type,
        info: this.info,
        langcode: this.langcode,
        status: this.status,
        reusable: this.reusable,
      },
      this.instanceLoader,
    );
    duplicate.id = null;
    duplicate.revisionId = null;
    return duplicate;
  }

  /**
   * Ports getInstances(): the placed `block` config entities whose plugin id is
   * `block_content:<uuid>`.
   */
  getInstances(): unknown[] {
    return this.instanceLoader(`block_content:${this.uuid}`);
  }

  static get entityTypeId(): string {
    return BLOCK_CONTENT_ENTITY_TYPE;
  }

  static get adminPermission(): string {
    return 'administer block content';
  }

  static get collectionPermission(): string {
    return 'access block library';
  }
}
