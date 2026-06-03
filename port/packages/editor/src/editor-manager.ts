import type {
  DrupalEditorSettings,
  EditorAttachments,
  EditorEntityInterface,
  EditorJsSettingsAlter,
  EditorPluginDefinition,
  EditorPluginInterface,
  EditorStorageInterface,
} from './types.js';

/** Thrown when a requested editor plugin is not registered. */
export class EditorPluginNotFoundException extends Error {
  constructor(pluginId: string) {
    super(`The "${pluginId}" editor plugin does not exist.`);
    this.name = 'EditorPluginNotFoundException';
  }
}

/**
 * Configurable text editor manager.
 *
 * Port of `Drupal\editor\Plugin\EditorManager`. Holds the registry of editor
 * plugin definitions, instantiates plugins, and — the core attachment-to-text-
 * format behavior — aggregates libraries and per-format `drupalSettings` for a
 * set of text format IDs via {@link getAttachments}.
 *
 * PHP discovers plugins via attribute scanning; here definitions are registered
 * explicitly ({@link registerDefinition}) since JS has no class-name registry.
 *
 * @see core/modules/editor/src/Plugin/EditorManager.php
 */
export class EditorManager {
  private readonly definitions = new Map<string, EditorPluginDefinition>();
  private readonly jsSettingsAlters: EditorJsSettingsAlter[] = [];

  /** Static cache of resolved editors keyed by format id (null = none). */
  private readonly editors = new Map<string, EditorEntityInterface | null>();
  /** Static cache of accumulated attachments. */
  private attachments: EditorAttachments = { library: [] };

  constructor(private readonly storage: EditorStorageInterface) {}

  /** Registers an editor plugin definition (replaces attribute discovery). */
  registerDefinition(definition: EditorPluginDefinition): this {
    this.definitions.set(definition.id, definition);
    return this;
  }

  /** Registers a `hook_editor_js_settings_alter`-style callback. */
  addJsSettingsAlter(alter: EditorJsSettingsAlter): this {
    this.jsSettingsAlters.push(alter);
    return this;
  }

  hasDefinition(pluginId: string): boolean {
    return this.definitions.has(pluginId);
  }

  getDefinition(pluginId: string): EditorPluginDefinition | undefined {
    return this.definitions.get(pluginId);
  }

  getDefinitions(): Record<string, EditorPluginDefinition> {
    return Object.fromEntries(this.definitions);
  }

  /**
   * Available text editors as a `{ id: label }` map.
   *
   * @see EditorManager::listOptions
   */
  listOptions(): Record<string, string> {
    const options: Record<string, string> = {};
    for (const [id, definition] of this.definitions) {
      options[id] = definition.label;
    }
    return options;
  }

  /**
   * Instantiates an editor plugin.
   *
   * @throws {EditorPluginNotFoundException} when the plugin or its constructor
   *   is unavailable.
   */
  createInstance(
    pluginId: string,
    configuration: Record<string, unknown> = {},
  ): EditorPluginInterface {
    const definition = this.definitions.get(pluginId);
    if (!definition || typeof definition.class !== 'function') {
      throw new EditorPluginNotFoundException(pluginId);
    }
    return new definition.class(configuration, pluginId, definition);
  }

  /**
   * Retrieves text editor libraries and JavaScript settings for the given text
   * format IDs, as an `#attached`-shaped object — or an empty array when there
   * is nothing to attach.
   *
   * Formats without a configured editor are cached as `null` so they are not
   * re-loaded. Aggregated JS settings are passed through any registered
   * alters before being returned.
   *
   * @see EditorManager::getAttachments
   */
  getAttachments(formatIds: string[]): EditorAttachments | [] {
    const settings: DrupalEditorSettings = this.attachments.drupalSettings ?? {};

    const idsToLoad = formatIds.filter((id) => !this.editors.has(id));
    if (idsToLoad.length > 0) {
      const loaded = this.storage.loadMultiple(idsToLoad);

      // Cache loaded editors and record null for formats with no editor.
      for (const id of idsToLoad) {
        this.editors.set(id, loaded[id] ?? null);
      }

      for (const [formatId, editor] of Object.entries(loaded)) {
        const pluginId = editor.getEditor();
        if (!pluginId) continue;
        const plugin = this.createInstance(pluginId);
        const definition = plugin.getPluginDefinition();

        this.attachments.library = [
          ...this.attachments.library,
          ...plugin.getLibraries(editor),
        ];

        settings.editor ??= { formats: {} };
        settings.editor.formats[formatId] = {
          format: formatId,
          editor: pluginId,
          editorSettings: plugin.getJSSettings(editor),
          editorSupportsContentFiltering:
            definition.supports_content_filtering ?? false,
          isXssSafe: definition.is_xss_safe ?? false,
        };
      }
    }

    // Allow other modules to alter all JavaScript settings.
    for (const alter of this.jsSettingsAlters) alter(settings);

    if (this.attachments.library.length === 0 && this.isEmptySettings(settings)) {
      return [];
    }

    this.attachments.drupalSettings = settings;
    return this.attachments;
  }

  private isEmptySettings(settings: DrupalEditorSettings): boolean {
    return Object.keys(settings).length === 0;
  }
}
