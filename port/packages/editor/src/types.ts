/**
 * Type contracts for `@drupaljs/editor`.
 *
 * Port of `Drupal\editor`'s public seams: the configured-editor config entity,
 * the editor plugin interface and its plugin definition, the plugin manager,
 * and the storage/filter-format collaborators it depends on.
 *
 * @see core/modules/editor/src/EditorInterface.php
 * @see core/modules/editor/src/Plugin/EditorPluginInterface.php
 * @see core/modules/editor/src/Plugin/EditorManager.php
 * @see core/modules/editor/src/Attribute/Editor.php
 */

/**
 * Plugin inspection contract (subset of `Drupal\Component\Plugin`).
 *
 * TODO(@drupaljs/plugin): re-export {@link PluginInspectionInterface} from
 * `@drupaljs/plugin` once cross-package wiring is in place. This local shape is a
 * strict subset (id + definition) so it stays forward-compatible.
 */
export interface PluginInspectionInterface {
  getPluginId(): string;
  getPluginDefinition(): EditorPluginDefinition;
}

/**
 * Definition metadata for an editor plugin.
 *
 * Mirrors the fields of the PHP `#[Editor]` attribute. `id` and `label` are
 * required; the capability flags default to conservative (safe) values when a
 * definition omits them.
 *
 * @see core/modules/editor/src/Attribute/Editor.php
 */
export interface EditorPluginDefinition {
  /** The plugin ID. */
  id: string;
  /** Human-readable, translated label. */
  label: string;
  /** Whether the editor supports "allowed content only" filtering. */
  supports_content_filtering: boolean;
  /** Whether the editor supports inline editing. */
  supports_inline_editing: boolean;
  /** Whether the editor is not vulnerable to XSS attacks. */
  is_xss_safe: boolean;
  /** Form element `#type`s this editor can work on. */
  supported_element_types: string[];
  /** Providing module/package name (for dependency calculation). */
  provider?: string;
  /** Implementation constructor (JS has no class-name registry). */
  class?: EditorPluginConstructor;
  /** Pass-through metadata. */
  [key: string]: unknown;
}

/** Anything we can `new` to build an editor plugin instance. */
export type EditorPluginConstructor = new (
  configuration: Record<string, unknown>,
  pluginId: string,
  pluginDefinition: EditorPluginDefinition,
) => EditorPluginInterface;

/**
 * The configured text editor entity.
 *
 * Port of `Drupal\editor\EditorInterface` / `Entity\Editor`. An Editor is keyed
 * by the machine name of the text format it augments; its ID equals that format
 * ID.
 *
 * @see core/modules/editor/src/EditorInterface.php
 */
export interface EditorEntityInterface {
  /** Editor entity ID — equals the associated text format ID. */
  id(): string | null;
  /** TRUE when this editor has an associated filter format. */
  hasAssociatedFilterFormat(): boolean;
  /** The associated filter format, or null while it is still being created. */
  getFilterFormat(): FilterFormatInterface | null;
  /** The associated editor plugin ID. */
  getEditor(): string | null;
  /** Sets the editor plugin ID (chainable). */
  setEditor(editor: string): this;
  /** Plugin-specific settings. */
  getSettings(): Record<string, unknown>;
  /** Sets plugin-specific settings (chainable). */
  setSettings(settings: Record<string, unknown>): this;
  /** Image upload settings. */
  getImageUploadSettings(): Record<string, unknown>;
  /** Sets image upload settings (chainable). */
  setImageUploadSettings(imageUpload: Record<string, unknown>): this;
}

/**
 * A configurable text editor plugin.
 *
 * Port of `Drupal\editor\Plugin\EditorPluginInterface`. The form-handling
 * methods (`buildConfigurationForm`, etc.) of the PHP interface are omitted here
 * until `@drupaljs/form` exists; {@link EditorBase} still provides no-op stubs
 * so behavior matches.
 *
 * @see core/modules/editor/src/Plugin/EditorPluginInterface.php
 */
export interface EditorPluginInterface extends PluginInspectionInterface {
  /** Default settings stored on a configured Editor entity. */
  getDefaultSettings(): Record<string, unknown>;
  /** Client-side (JS) settings to attach for a configured editor. */
  getJSSettings(editor: EditorEntityInterface): Record<string, unknown>;
  /** Asset libraries to attach for a configured editor. */
  getLibraries(editor: EditorEntityInterface): string[];
}

/**
 * Minimal filter-format collaborator.
 *
 * TODO(@drupaljs/filter): replace with the real `FilterFormatInterface` from
 * `@drupaljs/filter` once that package exists. Only the members the editor
 * subsystem actually uses are modeled here.
 *
 * @see core/modules/editor/src/Entity/Editor.php (label / dependencies)
 */
export interface FilterFormatInterface {
  id(): string;
  label(): string;
  getConfigDependencyName(): string;
}

/**
 * Storage that loads {@link EditorEntityInterface} instances by format ID.
 *
 * Models the slice of `EntityStorageInterface` that {@link EditorManager} uses.
 *
 * TODO(@drupaljs/entity): replace with the real entity storage contract.
 */
export interface EditorStorageInterface {
  /** Loads editors keyed by ID; missing IDs are simply absent. */
  loadMultiple(ids: string[]): Record<string, EditorEntityInterface>;
}

/** Renderable `#attached` shape produced by {@link EditorManager.getAttachments}. */
export interface EditorAttachments {
  library: string[];
  drupalSettings?: DrupalEditorSettings;
}

/** Per-format JavaScript settings nested under `drupalSettings.editor.formats`. */
export interface EditorFormatSettings {
  format: string;
  editor: string;
  editorSettings: Record<string, unknown>;
  editorSupportsContentFiltering: boolean;
  isXssSafe: boolean;
}

/** Shape of the `editor` namespace inside `drupalSettings`. */
export interface DrupalEditorSettings {
  editor?: {
    formats: Record<string, EditorFormatSettings>;
  };
  [key: string]: unknown;
}

/**
 * Optional hook for altering aggregated JS settings (port of
 * `hook_editor_js_settings_alter`). Receives and mutates the settings object.
 */
export type EditorJsSettingsAlter = (settings: DrupalEditorSettings) => void;
