/**
 * Port of `Drupal\block_content\Entity\BlockContentType` — the config bundle
 * entity for content blocks (`block_content_type`). A config entity, so it is a
 * plain serialisable definition rather than a content/field entity.
 *
 * @see drupal-core/core/modules/block_content/src/Entity/BlockContentType.php
 */

import { t } from './types.js';

/** The entity type id of the bundle entity. */
export const BLOCK_CONTENT_TYPE_ENTITY_TYPE = 'block_content_type';

/** The entity type id the bundle is a bundle of. */
export const BLOCK_CONTENT_ENTITY_TYPE = 'block_content';

/**
 * The exported config keys, matching the `config_export` list in the original
 * `#[ConfigEntityType]` attribute. Order is significant for config schema.
 */
export const BLOCK_CONTENT_TYPE_CONFIG_EXPORT = [
  'id',
  'label',
  'revision',
  'description',
] as const;

/** Ports `BlockContentTypeInterface`. */
export interface BlockContentTypeValues {
  /** The block type machine id. */
  id: string;
  /** The human-readable label. */
  label: string;
  /** Whether a new revision is created by default for blocks of this type. */
  revision?: boolean;
  /** Optional description shown on the block type listing. */
  description?: string | null;
}

export class BlockContentType {
  readonly id: string;
  label: string;
  /** Default revision setting for content blocks of this type. */
  revision: boolean;
  private description: string | null;

  constructor(values: BlockContentTypeValues) {
    if (!values.id) {
      throw new Error('A block_content_type requires an "id".');
    }
    this.id = values.id;
    this.label = values.label ?? '';
    this.revision = values.revision ?? false;
    this.description = values.description ?? null;
  }

  /** The bundle entity id (config entity id). */
  getId(): string {
    return this.id;
  }

  getLabel(): string {
    return this.label;
  }

  /** Ports EntityDescriptionInterface::getDescription(); empty string default. */
  getDescription(): string {
    return this.description ?? '';
  }

  /** Ports EntityDescriptionInterface::setDescription(). */
  setDescription(description: string | null): this {
    this.description = description;
    return this;
  }

  /** Ports RevisionableEntityBundleInterface::shouldCreateNewRevision(). */
  shouldCreateNewRevision(): boolean {
    return this.revision;
  }

  /** The entity type this bundle is a bundle of. */
  getEntityType(): string {
    return BLOCK_CONTENT_ENTITY_TYPE;
  }

  /** Serialises only the exported config keys (config_export order). */
  toConfig(): Record<string, unknown> {
    return {
      id: this.id,
      label: this.label,
      revision: this.revision,
      description: this.description,
    };
  }

  static get adminPermission(): string {
    return 'administer block types';
  }

  /** Human label used by the bundle UI. */
  static get bundleLabel(): string {
    return t('Block type');
  }
}
