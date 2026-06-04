/**
 * Local minimal contracts for `@drupaljs/module-views_ui`.
 *
 * These mirror the slices of Drupal core APIs that views_ui depends on. Each is
 * a thin LOCAL definition because the upstream `@drupaljs/*` packages that will
 * own these types are still scaffolds. When they land, replace these with
 * imports.
 */

// ---------------------------------------------------------------------------
// Render array (Drupal render API)
// ---------------------------------------------------------------------------

/** A minimal Drupal render array (recursive). */
export interface RenderArray {
  '#type'?: string;
  '#theme'?: string;
  '#markup'?: string;
  '#plain_text'?: string;
  '#title'?: string;
  '#attributes'?: Record<string, unknown>;
  '#attached'?: Record<string, unknown>;
  '#empty'?: string;
  '#rows'?: Record<string, unknown>;
  '#headers'?: unknown;
  '#displays'?: unknown;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Entity operations (Drupal\Core\Entity\EntityListBuilder operations)
// ---------------------------------------------------------------------------

/** A single operation link in an entity-list operations dropdown. */
export interface OperationLink {
  title: string;
  weight?: number;
  url: string;
  attributes?: Record<string, unknown>;
}

/** Map of operation machine name -> operation link. */
export type OperationLinks = Record<string, OperationLink>;

// ---------------------------------------------------------------------------
// View config entity (Drupal\views\Entity\View, a ConfigEntity)
// ---------------------------------------------------------------------------

/**
 * One display row as surfaced by `ViewListBuilder::getDisplaysList()`.
 * `display` is the plugin's admin label; `path` is the rendered path (or false).
 */
export interface DisplayListEntry {
  display: string;
  path: string | false;
}

/**
 * A single display handler on an executable view, reduced to the surface the
 * list builder touches.
 *
 * TODO(@drupaljs/module-views): replace with the shared DisplayPluginBase port.
 */
export interface DisplayHandlerLike {
  /** True when the display exposes a routable path (e.g. page displays). */
  hasPath(): boolean;
  /** The display path without a leading slash, when {@link hasPath} is true. */
  getPath(): string;
  /** The plugin definition; `admin` is the human-readable display label. */
  getPluginDefinition(): { admin?: string };
}

/**
 * Minimal executable-view contract.
 *
 * TODO(@drupaljs/module-views): replace with the shared ViewExecutable port.
 */
export interface ViewExecutableLike {
  initDisplay(): void;
  /** Display handlers keyed by display id (order-insensitive). */
  displayHandlers: Record<string, DisplayHandlerLike>;
}

/**
 * Minimal View config-entity contract.
 *
 * TODO(@drupaljs/module-views): replace with the shared ViewEntityInterface.
 */
export interface ViewEntityLike {
  id(): string;
  label(): string;
  /** Enabled status. */
  status(): boolean;
  /** Arbitrary config value accessor (`description`, `tag`, ...). */
  get(key: string): unknown;
  hasLinkTemplate(template: string): boolean;
  /** Resolves a link-template name to a URL string. */
  toUrl(rel: string): string;
  /** Lazily built executable used to enumerate displays. */
  getExecutable(): ViewExecutableLike;
}

// ---------------------------------------------------------------------------
// Block plugin (Drupal\Core\Block\BlockPluginInterface) — for entity_operation
// ---------------------------------------------------------------------------

/** Minimal block-plugin contract for the entity-operation hook. */
export interface BlockPluginLike {
  getBaseId(): string;
  getDerivativeId(): string;
}

/**
 * Minimal block config-entity contract. `getPlugin` mirrors
 * `Drupal\block\BlockInterface::getPlugin()`.
 */
export interface BlockEntityLike {
  getPlugin(): BlockPluginLike;
}
