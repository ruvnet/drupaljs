import type {
  EditorEntityInterface,
  EditorPluginDefinition,
  EditorPluginInterface,
} from './types.js';

/**
 * Base class from which modules providing text editors may extend.
 *
 * Port of `Drupal\editor\Plugin\EditorBase`. Provides default (no-op / empty)
 * implementations so concrete editors only override what they need. Subclasses
 * receive the standard plugin constructor signature
 * `(configuration, pluginId, pluginDefinition)`.
 *
 * @see core/modules/editor/src/Plugin/EditorBase.php
 */
export abstract class EditorBase implements EditorPluginInterface {
  protected configuration: Record<string, unknown>;
  protected pluginId: string;
  protected pluginDefinition: EditorPluginDefinition;

  constructor(
    configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: EditorPluginDefinition,
  ) {
    this.configuration = configuration;
    this.pluginId = pluginId;
    this.pluginDefinition = pluginDefinition;
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): EditorPluginDefinition {
    return this.pluginDefinition;
  }

  getDefaultSettings(): Record<string, unknown> {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getJSSettings(_editor: EditorEntityInterface): Record<string, unknown> {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLibraries(_editor: EditorEntityInterface): string[] {
    return [];
  }
}
