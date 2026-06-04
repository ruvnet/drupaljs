import type {
  EditorEntityInterface,
  FilterFormatInterface,
} from './types.js';

/** Raw config values used to construct an {@link Editor}. */
export interface EditorValues {
  format?: string | null;
  editor?: string | null;
  settings?: Record<string, unknown>;
  image_upload?: Record<string, unknown>;
}

/** Calculated config-entity dependencies. */
export interface EditorDependencies {
  config: string[];
  module: string[];
}

/**
 * Collaborators the {@link Editor} entity defers to, replacing PHP's global
 * `\Drupal::service()` calls. All members are optional so a bare Editor can be
 * built (mirroring PHP's tolerance of a missing plugin manager on construction).
 *
 * TODO(@drupaljs/entity, @drupaljs/plugin, @drupaljs/filter): fold these into
 * the real entity/plugin-manager/filter-format services once those packages
 * exist; the resolver shape keeps the seam test-friendly until then.
 */
export interface EditorResolver {
  /** Default settings for an editor plugin id (may throw if plugin missing). */
  defaultSettingsFor?(editorPluginId: string): Record<string, unknown>;
  /** Loads the filter format for a given format id, or null. */
  loadFilterFormat?(formatId: string): FilterFormatInterface | null;
  /** The providing module/package for an editor plugin id. */
  providerFor?(editorPluginId: string): string | undefined;
}

/**
 * The configured text editor config entity.
 *
 * Port of `Drupal\editor\Entity\Editor`. Keyed by the machine name of the text
 * format it augments — its ID equals that format ID. On construction it seeds
 * `settings` from the editor plugin's default settings (PHP `$settings +=`),
 * tolerating a missing plugin.
 *
 * @see core/modules/editor/src/Entity/Editor.php
 */
export class Editor implements EditorEntityInterface {
  protected format: string | null;
  protected editor: string | null;
  protected settings: Record<string, unknown>;
  protected image_upload: Record<string, unknown>;
  protected filterFormat: FilterFormatInterface | null = null;

  constructor(
    values: EditorValues = {},
    private readonly resolver: EditorResolver = {},
  ) {
    this.format = values.format ?? null;
    this.editor = values.editor ?? null;
    this.settings = { ...(values.settings ?? {}) };
    this.image_upload = { ...(values.image_upload ?? {}) };

    // Seed plugin default settings, filling only keys not already set.
    if (this.editor && this.resolver.defaultSettingsFor) {
      try {
        const defaults = this.resolver.defaultSettingsFor(this.editor);
        for (const [key, value] of Object.entries(defaults)) {
          if (!(key in this.settings)) this.settings[key] = value;
        }
      } catch {
        // Editor plugin has gone missing: still allow construction, just skip
        // seeding defaults (matches PluginNotFoundException handling).
      }
    }
  }

  id(): string | null {
    return this.format;
  }

  label(): string {
    return this.getFilterFormat()?.label() ?? '';
  }

  hasAssociatedFilterFormat(): boolean {
    return this.format !== null;
  }

  getFilterFormat(): FilterFormatInterface | null {
    if (!this.filterFormat && this.format && this.resolver.loadFilterFormat) {
      this.filterFormat = this.resolver.loadFilterFormat(this.format);
    }
    return this.filterFormat;
  }

  getEditor(): string | null {
    return this.editor;
  }

  setEditor(editor: string): this {
    this.editor = editor;
    return this;
  }

  getSettings(): Record<string, unknown> {
    return this.settings;
  }

  setSettings(settings: Record<string, unknown>): this {
    this.settings = settings;
    return this;
  }

  getImageUploadSettings(): Record<string, unknown> {
    return this.image_upload;
  }

  setImageUploadSettings(imageUpload: Record<string, unknown>): this {
    this.image_upload = imageUpload;
    return this;
  }

  /**
   * Calculates config-entity dependencies: a config dependency on the
   * associated filter format, plus a module dependency on the editor plugin's
   * provider when resolvable.
   *
   * @see core/modules/editor/src/Entity/Editor.php::calculateDependencies
   */
  calculateDependencies(): EditorDependencies {
    const dependencies: EditorDependencies = { config: [], module: [] };

    const format = this.getFilterFormat();
    if (format) {
      dependencies.config.push(format.getConfigDependencyName());
    }

    if (this.editor && this.resolver.providerFor) {
      const provider = this.resolver.providerFor(this.editor);
      if (provider) dependencies.module.push(provider);
    }

    return dependencies;
  }
}
