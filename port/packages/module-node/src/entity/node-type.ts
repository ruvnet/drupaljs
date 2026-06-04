/**
 * Port of `Drupal\node\Entity\NodeType` and `Drupal\node\NodeTypeInterface`.
 *
 * NodeType is the bundle (config entity) for nodes — each instance describes a
 * content type such as "article" or "page". Only the behavioural surface
 * relevant to a minimal vertical slice is ported; storage/config-export concerns
 * are delegated to the (not-yet-ported) config-entity subsystem.
 */

/**
 * Enumeration for node preview modes. Ports `Drupal\node\NodePreviewMode`,
 * preserving the integer backing values used in config.
 */
export enum NodePreviewMode {
  Disabled = 0,
  Optional = 1,
  Required = 2,
}

/** Constructor values for a {@link NodeType}. Mirrors node.type config schema. */
export interface NodeTypeValues {
  /** Machine name / bundle id, e.g. "article". */
  type: string;
  /** Human-readable label. */
  name: string;
  description?: string;
  help?: string;
  /** Whether a new revision is created by default on save. Drupal default: true. */
  new_revision?: boolean;
  /** Whether "Submitted by" info is shown. Drupal default: true. */
  display_submitted?: boolean;
  /** Preview mode. Drupal default: Optional. */
  preview_mode?: NodePreviewMode;
  /** Module name that locks the type, or false/absent if unlocked. */
  locked?: string | false;
}

/**
 * Interface defining a node type entity. Ports the bespoke methods of
 * `Drupal\node\NodeTypeInterface` (the generic config-entity members live in the
 * entity subsystem and are out of scope here).
 */
export interface NodeTypeInterface {
  id(): string;
  label(): string;
  getDescription(): string;
  getHelp(): string;
  isLocked(): string | false;
  setNewRevision(newRevision: boolean): void;
  shouldCreateNewRevision(): boolean;
  displaySubmitted(): boolean;
  setDisplaySubmitted(displaySubmitted: boolean): void;
  getPreviewMode(): NodePreviewMode;
  setPreviewMode(previewMode: NodePreviewMode): void;
}

export class NodeType implements NodeTypeInterface {
  private readonly type: string;
  private readonly name: string;
  private readonly description: string;
  private readonly help: string;
  private readonly locked: string | false;
  private newRevision: boolean;
  private display_submitted: boolean;
  private preview_mode: NodePreviewMode;

  constructor(values: NodeTypeValues) {
    this.type = values.type;
    this.name = values.name;
    this.description = values.description ?? '';
    this.help = values.help ?? '';
    this.locked = values.locked ?? false;
    this.newRevision = values.new_revision ?? true;
    this.display_submitted = values.display_submitted ?? true;
    this.preview_mode = values.preview_mode ?? NodePreviewMode.Optional;
  }

  id(): string {
    return this.type;
  }

  label(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getHelp(): string {
    return this.help;
  }

  isLocked(): string | false {
    return this.locked;
  }

  setNewRevision(newRevision: boolean): void {
    this.newRevision = newRevision;
  }

  shouldCreateNewRevision(): boolean {
    return this.newRevision;
  }

  displaySubmitted(): boolean {
    return this.display_submitted;
  }

  setDisplaySubmitted(displaySubmitted: boolean): void {
    this.display_submitted = displaySubmitted;
  }

  getPreviewMode(): NodePreviewMode {
    return this.preview_mode;
  }

  setPreviewMode(previewMode: NodePreviewMode): void {
    this.preview_mode = previewMode;
  }
}
