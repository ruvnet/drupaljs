/**
 * Action config entity — TypeScript port of `Drupal\system\Entity\Action`
 * (`core/modules/system/src/Entity/Action.php`) and `ActionConfigEntityInterface`.
 *
 * The original is a `#[ConfigEntityType(id: 'action', ...)]` wrapping an action
 * plugin via a LazyPluginCollection. Persisted config is
 * `id, label, type, plugin, configuration`. We model:
 *  - `create()`: defaults `label` to the plugin definition label when omitted,
 *  - `isConfigurable()`: true when the plugin instance is a ConfigurableInterface,
 *  - `sort()`: by `type` (natural, case-insensitive) then label,
 *  - `getType()`.
 */
import {
  ConfigEntityBase,
  type ConfigEntityTypeDefinition,
  type ConfigEntityValues,
} from './config-entity-base.js';

/**
 * The slice of the action plugin manager Action collaborates with.
 *
 * TODO(@drupaljs/action): replace with the real ActionManager /
 * PluginManagerInterface from the action package once it lands.
 */
export interface ActionPluginManagerLike {
  getDefinition(pluginId: string): { id: string; label?: string } | undefined;
  createInstance(pluginId: string, configuration?: Record<string, unknown>): ActionPluginLike;
}

/** Minimal action plugin instance shape. */
export interface ActionPluginLike {
  getPluginId(): string;
  getPluginDefinition(): { id: string; [key: string]: unknown };
  /** Presence marks the plugin as ConfigurableInterface (Drupal duck-type). */
  defaultConfiguration?: () => Record<string, unknown>;
}

/** Ports `ActionConfigEntityInterface`. */
export interface ActionConfigEntityInterface {
  id(): string | undefined;
  label(): string | undefined;
  getType(): string | undefined;
  isConfigurable(): boolean;
}

/** The `#[ConfigEntityType]` metadata for the action entity. */
export const ACTION_ENTITY_TYPE: ConfigEntityTypeDefinition = {
  id: 'action',
  label: 'Action',
  entity_keys: { id: 'id', label: 'label' },
  admin_permission: 'administer actions',
  config_export: ['id', 'label', 'type', 'plugin', 'configuration'],
};

export interface ActionValues extends ConfigEntityValues {
  type?: string;
  plugin?: string;
  configuration?: Record<string, unknown>;
}

export class Action extends ConfigEntityBase implements ActionConfigEntityInterface {
  private readonly pluginManager?: ActionPluginManagerLike;

  constructor(values: ActionValues, pluginManager?: ActionPluginManagerLike) {
    super(values);
    if (pluginManager !== undefined) {
      this.pluginManager = pluginManager;
    }
  }

  protected override entityType(): ConfigEntityTypeDefinition {
    return ACTION_ENTITY_TYPE;
  }

  /**
   * Faithful to Action::create(): when no `label` is supplied but a `plugin`
   * is, default the label to the action plugin definition's label. A missing
   * plugin definition is tolerated (PHP catches PluginNotFoundException).
   */
  static create(values: ActionValues, pluginManager?: ActionPluginManagerLike): Action {
    const next: ActionValues = { ...values };
    if (
      next.label === undefined &&
      typeof next.plugin === 'string' &&
      pluginManager !== undefined
    ) {
      const definition = pluginManager.getDefinition(next.plugin);
      if (definition?.label !== undefined) {
        next.label = definition.label;
      }
    }
    return new Action(next, pluginManager);
  }

  getType(): string | undefined {
    return this.values['type'] as string | undefined;
  }

  private getConfiguration(): Record<string, unknown> {
    return (this.values['configuration'] as Record<string, unknown> | undefined) ?? {};
  }

  /**
   * Faithful to `getPlugin() instanceof ConfigurableInterface`. We duck-type
   * ConfigurableInterface by the presence of `defaultConfiguration`.
   */
  isConfigurable(): boolean {
    if (this.pluginManager === undefined || typeof this.values['plugin'] !== 'string') {
      return false;
    }
    const instance = this.pluginManager.createInstance(
      this.values['plugin'] as string,
      this.getConfiguration(),
    );
    return typeof instance.defaultConfiguration === 'function';
  }

  protected override exportValue(key: string): unknown {
    if (key === 'configuration') {
      return this.getConfiguration();
    }
    return this.values[key];
  }

  /**
   * Faithful to Action::sort(): order by `type` (natural, case-insensitive),
   * then fall back to the default config-entity ordering by label.
   */
  static sort(a: Action, b: Action): number {
    const aType = a.getType() ?? '';
    const bType = b.getType() ?? '';
    if (aType !== bType) {
      return aType.localeCompare(bType, undefined, { numeric: true, sensitivity: 'accent' });
    }
    const aLabel = a.label() ?? '';
    const bLabel = b.label() ?? '';
    return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'accent' });
  }
}
