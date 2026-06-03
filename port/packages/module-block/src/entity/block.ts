/**
 * The `block` configuration entity.
 *
 * Ports `Drupal\block\Entity\Block` (and `BlockInterface`) — a ConfigEntity
 * describing the placement of one block plugin into a theme region. PHP-only
 * concerns (the full ConfigEntityBase lifecycle, validation constraints driven by
 * Symfony, the ConditionPluginCollection) are reduced to the behaviour the
 * vertical slice exercises: plugin access, label resolution, sorting, region /
 * weight mutation, duplication and config export.
 *
 * TODO(@drupaljs/entity): extend the shared ConfigEntity base class once the
 * entity package lands, instead of carrying config fields locally.
 */
import {
  BlockPluginCollection,
  type BlockPlugin,
  type BlockPluginManager,
} from '../plugin/block-plugin.js';

/** Visibility condition configuration keyed by condition plugin instance id. */
export type VisibilityConfig = Record<string, Record<string, unknown>>;

/** The persisted config shape (mirrors Block's `config_export` list). */
export interface BlockConfig {
  id?: string;
  theme: string;
  region?: string;
  weight?: number;
  provider?: string;
  plugin: string;
  settings?: Record<string, unknown>;
  visibility?: VisibilityConfig;
  /** Whether the block is enabled. Drupal stores this as the `status` key. */
  status?: boolean;
}

/** The keys emitted by {@link Block.toConfig}, matching Drupal's config_export. */
const CONFIG_EXPORT_KEYS = [
  'id',
  'theme',
  'region',
  'weight',
  'provider',
  'plugin',
  'settings',
  'visibility',
] as const;

/**
 * Defines a block placement.
 *
 * Ports `Drupal\block\BlockInterface`.
 */
export interface BlockInterface {
  id(): string | undefined;
  label(): string;
  status(): boolean;
  /** Access check for an operation (e.g. "view"). Overridable per instance. */
  access(operation?: string): boolean;
  getPlugin(): BlockPlugin;
  getPluginId(): string;
  getRegion(): string | undefined;
  getTheme(): string;
  getWeight(): number;
  getVisibility(): VisibilityConfig;
  setVisibilityConfig(instanceId: string, configuration: Record<string, unknown>): this;
  setRegion(region: string): this;
  setWeight(weight: number): this;
  enable(): this;
  disable(): this;
  createDuplicateBlock(newId?: string, newTheme?: string): Block;
  toConfig(): Partial<BlockConfig>;
}

export class Block implements BlockInterface {
  private config: BlockConfig;
  private pluginCollection?: BlockPluginCollection;
  /** Access checker, defaulted to allow; overridable for tests / real handler. */
  public access: (operation?: string) => boolean = () => true;

  constructor(
    config: BlockConfig,
    private readonly pluginManager: BlockPluginManager,
  ) {
    this.config = {
      weight: 0,
      settings: {},
      visibility: {},
      status: true,
      ...config,
    };
  }

  id(): string | undefined {
    return this.config.id;
  }

  status(): boolean {
    return this.config.status ?? true;
  }

  getPluginId(): string {
    return this.config.plugin;
  }

  getRegion(): string | undefined {
    return this.config.region;
  }

  getTheme(): string {
    return this.config.theme;
  }

  getWeight(): number {
    return this.config.weight ?? 0;
  }

  getPlugin(): BlockPlugin {
    if (this.pluginCollection === undefined) {
      this.pluginCollection = new BlockPluginCollection(
        this.pluginManager,
        this.config.plugin,
        this.config.settings ?? {},
      );
    }
    return this.pluginCollection.get();
  }

  /**
   * The configured label, falling back to the plugin's admin_label.
   * Ports Block::label().
   */
  label(): string {
    const settingsLabel = this.config.settings?.label;
    if (typeof settingsLabel === 'string' && settingsLabel !== '') {
      return settingsLabel;
    }
    return this.getPlugin().getPluginDefinition().admin_label;
  }

  getVisibility(): VisibilityConfig {
    return this.config.visibility ?? {};
  }

  setVisibilityConfig(instanceId: string, configuration: Record<string, unknown>): this {
    const visibility = { ...(this.config.visibility ?? {}) };
    visibility[instanceId] = { id: instanceId, ...configuration };
    this.config.visibility = visibility;
    return this;
  }

  setRegion(region: string): this {
    this.config.region = region;
    return this;
  }

  /** Ports Block::setWeight() — coerces to an integer (preSave behaviour). */
  setWeight(weight: number): this {
    this.config.weight = Math.trunc(Number(weight));
    return this;
  }

  enable(): this {
    this.config.status = true;
    return this;
  }

  disable(): this {
    this.config.status = false;
    return this;
  }

  /** Ports Block::createDuplicateBlock(). Clears the id so a save inserts anew. */
  createDuplicateBlock(newId?: string, newTheme?: string): Block {
    const config: BlockConfig = { ...this.config };
    // Drupal createDuplicate() unsets the id so a save inserts a new entity.
    delete config.id;
    if (newId !== undefined) {
      config.id = newId;
    }
    const dup = new Block(config, this.pluginManager);
    if (newTheme) {
      dup.setTheme(newTheme);
    }
    return dup;
  }

  private setTheme(theme: string): void {
    this.config.theme = theme;
  }

  /** Emits only the declared config_export keys. Ports ConfigEntity export. */
  toConfig(): Partial<BlockConfig> {
    const out: Partial<BlockConfig> = {};
    for (const key of CONFIG_EXPORT_KEYS) {
      const value = this.config[key];
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[key] = value;
      }
    }
    return out;
  }
}

/**
 * Sorts active blocks by weight and inactive blocks by name.
 * Ports the static `Block::sort()` comparator used by the repository.
 */
export function sortBlocks(a: BlockInterface, b: BlockInterface): number {
  const status = Number(b.status()) - Number(a.status());
  if (status !== 0) {
    return status;
  }
  const weight = a.getWeight() - b.getWeight();
  if (weight !== 0) {
    return weight;
  }
  return a.label() < b.label() ? -1 : a.label() > b.label() ? 1 : 0;
}
