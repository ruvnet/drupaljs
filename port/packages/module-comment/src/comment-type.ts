/**
 * The `comment_type` config entity — a comment bundle bound to a target entity
 * type. Ports `Drupal\comment\Entity\CommentType` and its interface.
 *
 * The full ConfigEntityBundleBase machinery (config storage, dependency
 * calculation) lives in the config/entity packages; this models the
 * config_export surface and accessors the comment module itself uses.
 */

/** Config-exported values for a comment type. Ports the `config_export` list. */
export interface CommentTypeValues {
  /** Machine name. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Entity type this comment type can be attached to, e.g. "node". */
  readonly target_entity_type_id: string;
  /** Optional administrative description. */
  readonly description?: string;
}

/** Ports Drupal\comment\CommentTypeInterface. */
export interface CommentTypeInterface {
  id(): string;
  label(): string;
  getDescription(): string | undefined;
  setDescription(description: string): this;
  getTargetEntityTypeId(): string;
}

export class CommentType implements CommentTypeInterface {
  /** The entity type id this config entity defines. */
  static readonly ENTITY_TYPE_ID = 'comment_type';
  /** The content entity type this is a bundle of. Ports `bundle_of`. */
  static readonly BUNDLE_OF = 'comment';
  /** Ports `admin_permission`. */
  static readonly ADMIN_PERMISSION = 'administer comment types';

  private readonly _id: string;
  private readonly _label: string;
  private readonly _targetEntityTypeId: string;
  private _description?: string;

  constructor(values: CommentTypeValues) {
    if (!values.id) {
      throw new Error('A comment_type requires a non-empty id.');
    }
    this._id = values.id;
    this._label = values.label;
    this._targetEntityTypeId = values.target_entity_type_id;
    this._description = values.description;
  }

  id(): string {
    return this._id;
  }

  label(): string {
    return this._label;
  }

  getDescription(): string | undefined {
    return this._description;
  }

  setDescription(description: string): this {
    this._description = description;
    return this;
  }

  getTargetEntityTypeId(): string {
    return this._targetEntityTypeId;
  }

  /** Returns the config-exported representation. */
  toConfig(): CommentTypeValues {
    const config: CommentTypeValues = {
      id: this._id,
      label: this._label,
      target_entity_type_id: this._targetEntityTypeId,
      ...(this._description !== undefined ? { description: this._description } : {}),
    };
    return config;
  }
}
