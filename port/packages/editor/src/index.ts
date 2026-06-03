/**
 * @drupaljs/editor — TypeScript port of Drupal's `editor` module.
 *
 * Provides the configurable text-editor subsystem: the `Editor` config entity
 * (which associates an editor plugin + settings with a text format), the
 * `EditorPluginInterface`/`EditorBase` contract for editor plugins, and the
 * `EditorManager` that registers plugins and attaches their libraries + JS
 * settings to text formats.
 *
 * @see core/modules/editor (Drupal 11 source)
 * @see ADR-0014 (monorepo), ADR-0016 (TDD/Vitest), ADR-0017 (package ownership)
 */

// Contracts
export type {
  PluginInspectionInterface,
  EditorPluginDefinition,
  EditorPluginConstructor,
  EditorEntityInterface,
  EditorPluginInterface,
  FilterFormatInterface,
  EditorStorageInterface,
  EditorAttachments,
  EditorFormatSettings,
  DrupalEditorSettings,
  EditorJsSettingsAlter,
} from './types.js';

// Editor plugin base
export { EditorBase } from './editor-base.js';

// Config entity
export {
  Editor,
  type EditorValues,
  type EditorDependencies,
  type EditorResolver,
} from './editor.js';

// Plugin manager + attachment logic
export {
  EditorManager,
  EditorPluginNotFoundException,
} from './editor-manager.js';
