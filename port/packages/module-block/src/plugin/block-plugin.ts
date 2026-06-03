/**
 * Block plugin contracts for `@drupaljs/module-block`.
 *
 * Ports the minimal surface of `Drupal\Core\Block\BlockPluginInterface` and the
 * `Drupal\block\BlockPluginCollection` lazy plugin holder. The full block plugin
 * system (derivatives, condition plugins, plugin discovery) lives in the plugin
 * subsystem; only what the Block config entity needs is modelled here.
 *
 * TODO(@drupaljs/plugin): replace the local BlockPlugin / BlockPluginManager
 * types with the shared plugin-system contracts once that package exposes them.
 */

/** A block plugin definition (subset of the annotation/attribute metadata). */
export interface BlockPluginDefinition {
  readonly id: string;
  /** Human-facing label shown in the block library / as the default block label. */
  readonly admin_label: string;
  readonly category?: string;
  [key: string]: unknown;
}

/** Plugin configuration (settings) blob. Drupal stores this under `settings`. */
export type BlockPluginConfiguration = Record<string, unknown>;

/**
 * A configured block plugin instance.
 *
 * Ports the slice of `BlockPluginInterface` the entity layer depends on:
 * configuration access, definition inspection and the user-facing label.
 */
export interface BlockPlugin {
  readonly pluginId: string;
  getConfiguration(): BlockPluginConfiguration;
  setConfiguration(configuration: BlockPluginConfiguration): void;
  getPluginDefinition(): BlockPluginDefinition;
  /** The user-facing block label (defaults to the definition's admin_label). */
  label(): string;
}

/**
 * Factory for block plugin instances.
 *
 * Ports `plugin.manager.block`'s `createInstance($plugin_id, $configuration)`.
 */
export interface BlockPluginManager {
  createInstance(pluginId: string, configuration: BlockPluginConfiguration): BlockPlugin;
}

/**
 * A single-plugin lazy collection, ported from `Drupal\block\BlockPluginCollection`.
 *
 * The block entity holds exactly one block plugin; this defers instantiation
 * until first access and memoises the result, mirroring the LazyPluginCollection
 * semantics without the full Drupal collection machinery.
 */
export class BlockPluginCollection {
  private instance?: BlockPlugin;

  constructor(
    private readonly manager: BlockPluginManager,
    private readonly pluginId: string,
    private readonly configuration: BlockPluginConfiguration,
  ) {}

  /** Returns the (memoised) plugin instance, creating it on first call. */
  get(): BlockPlugin {
    if (this.instance === undefined) {
      this.instance = this.manager.createInstance(this.pluginId, this.configuration);
    }
    return this.instance;
  }

  /** Returns the plugin's current configuration. */
  getConfiguration(): BlockPluginConfiguration {
    return this.get().getConfiguration();
  }
}
