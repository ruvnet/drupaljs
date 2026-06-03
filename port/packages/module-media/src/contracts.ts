/**
 * Public contracts for @drupaljs/module-media.
 *
 * These mirror Drupal core's `media` module: the Media content entity, the
 * MediaType config entity (bundle), media source plugins, the access control
 * handler, and dynamic per-bundle permissions. Ref: core/modules/media.
 *
 * Deep entity/field/plugin/account infrastructure is modelled here with
 * minimal LOCAL types so this vertical slice stays self-contained until the
 * shared @drupaljs/* packages land.
 */

// ---------------------------------------------------------------------------
// Account / access (modelled locally — TODO replace with @drupaljs/* types)
// ---------------------------------------------------------------------------

// TODO(@drupaljs/session): replace with the real AccountInterface from the
// session/user package. Only the slice media's access handler needs is here.
/** Mirrors the slice of Drupal\Core\Session\AccountInterface media uses. */
export interface AccountInterface {
  /** The account's user id (0 = anonymous). */
  id(): number;
  /** Whether the account holds a named permission. */
  hasPermission(permission: string): boolean;
}

/** The three access outcomes. Mirrors Drupal\Core\Access\AccessResult kinds. */
export type AccessOutcome = 'allowed' | 'forbidden' | 'neutral';

/**
 * Result of an access check. Mirrors the consumed surface of
 * Drupal\Core\Access\AccessResultInterface (boolean outcome + optional reason).
 *
 * TODO(@drupaljs/access): replace with the real AccessResult once it lands.
 */
export interface AccessResult {
  readonly outcome: AccessOutcome;
  /** True only when outcome === 'allowed'. */
  isAllowed(): boolean;
  /** Human-readable reason for a non-allowed result, if any. */
  readonly reason?: string | undefined;
}

// ---------------------------------------------------------------------------
// Media source plugins
// ---------------------------------------------------------------------------

/**
 * Static plugin definition for a media source. Mirrors the data carried by
 * Drupal's #[MediaSource] attribute.
 */
export interface MediaSourceDefinition {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** Field types this source may be stored in (e.g. ['file'], ['image']). */
  readonly allowedFieldTypes: readonly string[];
  /** Metadata attribute name whose value is used as the default media name. */
  readonly defaultNameMetadataAttribute?: string;
  /** Metadata attribute name whose value is used for the thumbnail URI. */
  readonly thumbnailUriMetadataAttribute?: string;
  /** Default thumbnail filename used by the base source. */
  readonly defaultThumbnailFilename?: string;
}

/**
 * A media source plugin. Mirrors the consumed surface of
 * Drupal\media\MediaSourceInterface.
 *
 * Source plugins know how media is stored, how to read its metadata, and how
 * to derive a default name/thumbnail for a media item.
 */
export interface MediaSourceInterface {
  /** The plugin's static definition. */
  getPluginDefinition(): MediaSourceDefinition;
  /** Per-instance configuration (always includes `source_field`). */
  getConfiguration(): MediaSourceConfiguration;
  /** Map of metadata attribute name -> human-readable label. */
  getMetadataAttributes(): Record<string, string>;
  /** Value of a metadata attribute for a media item, or null if unavailable. */
  getMetadata(media: MediaInterface, attributeName: string): unknown;
  /** Primary value stored in the configured source field, or null if empty. */
  getSourceFieldValue(media: MediaInterface): unknown;
}

/** Instance configuration for a media source. Mirrors source_configuration. */
export interface MediaSourceConfiguration {
  /** Machine name of the field that stores the source value. */
  source_field: string;
  [key: string]: unknown;
}

/** Default empty value for metadata fields (MediaSourceInterface). */
export const METADATA_FIELD_EMPTY = '_none';

// ---------------------------------------------------------------------------
// Field item access (modelled locally)
// ---------------------------------------------------------------------------

/**
 * The minimal field-item-list surface media reads: emptiness, the entity a
 * reference points to, and a primary scalar value.
 *
 * TODO(@drupaljs/entity): replace with the real FieldItemListInterface.
 */
export interface FieldItemList {
  isEmpty(): boolean;
  /** Referenced entity for entity-reference fields (e.g. file), if any. */
  readonly entity?: unknown;
  /** Primary stored value (mainPropertyName) of the first item. */
  readonly value?: unknown;
}

// ---------------------------------------------------------------------------
// Media type (bundle) config entity
// ---------------------------------------------------------------------------

/**
 * The Media type config entity (a bundle). Mirrors the consumed surface of
 * Drupal\media\MediaTypeInterface.
 */
export interface MediaTypeInterface {
  /** Machine name (bundle id). */
  id(): string;
  /** Human-readable label. */
  label(): string;
  /** Optional description. */
  getDescription(): string | undefined;
  /** True when thumbnail downloads are queued for background processing. */
  thumbnailDownloadsAreQueued(): boolean;
  /** The configured media source plugin instance. */
  getSource(): MediaSourceInterface;
  /** Metadata attribute name -> entity field name mapping. */
  getFieldMap(): Record<string, string>;
}

// ---------------------------------------------------------------------------
// Media content entity
// ---------------------------------------------------------------------------

/**
 * A media item. Mirrors the consumed surface of Drupal\media\MediaInterface
 * (plus the ContentEntity bits media's own code touches).
 */
export interface MediaInterface {
  /** Entity id, or null when unsaved. */
  id(): number | null;
  /** UUID. */
  uuid(): string;
  /** Bundle (media type) machine name. */
  bundle(): string;
  /** Owner (author) user id. */
  getOwnerId(): number;
  /** Published flag. */
  isPublished(): boolean;
  /** The media item name (label), falling back to the source default name. */
  getName(): string;
  /** Sets the media item name. Returns `this` for chaining. */
  setName(name: string): MediaInterface;
  /** Creation timestamp (unix seconds). */
  getCreatedTime(): number;
  /** The media source plugin for this item's bundle. */
  getSource(): MediaSourceInterface;
  /** Access a field item list by field name. */
  get(fieldName: string): FieldItemList;
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/** A permission descriptor. Mirrors the user module permission array shape. */
export interface PermissionDefinition {
  title: string;
  description?: string;
  /** When true, the permission grants elevated/risky access. */
  restrictAccess?: boolean;
}

/** Map of permission machine name -> descriptor. */
export type PermissionMap = Record<string, PermissionDefinition>;

// ---------------------------------------------------------------------------
// Hook integration
// ---------------------------------------------------------------------------

/**
 * The subset of @drupaljs/hook's ModuleHandler the media module registers
 * against. Mirrors `implement(module, hook, callback)`.
 *
 * TODO(@drupaljs/hook): import ModuleHandlerInterface directly once the build
 * wiring guarantees the dependency is resolvable from this package.
 */
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: any[]) => unknown): void;
}
