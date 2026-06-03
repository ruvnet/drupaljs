import type { PluginDefinition } from '@drupaljs/plugin';
import type {
  PluginSettingsConstructor,
  PluginSettingsInterface,
} from './contracts.js';

/**
 * Base class for plugins with configurable settings (formatters, widgets).
 *
 * Port of `Drupal\Core\Field\PluginSettingsBase`. Default settings are declared
 * via the static `defaultSettings()` method on the concrete subclass; instance
 * settings are merged over those defaults lazily.
 *
 * @see \Drupal\Core\Field\PluginSettingsBase
 */
export abstract class PluginSettingsBase implements PluginSettingsInterface {
  protected settings: Record<string, unknown>;
  protected thirdPartySettings: Record<string, Record<string, unknown>> = {};
  protected defaultSettingsMerged = false;

  constructor(
    protected readonly pluginId: string,
    protected readonly pluginDefinition: PluginDefinition,
    settings: Record<string, unknown> = {},
  ) {
    this.settings = { ...settings };
  }

  /** Defines the default settings for this plugin. Subclasses override. */
  static defaultSettings(): Record<string, unknown> {
    return {};
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): PluginDefinition {
    return this.pluginDefinition;
  }

  /** Lazily merges this plugin's static default settings under the instance ones. */
  protected mergeDefaults(): void {
    const ctor = this.constructor as unknown as PluginSettingsConstructor;
    this.settings = { ...ctor.defaultSettings(), ...this.settings };
    this.defaultSettingsMerged = true;
  }

  getSettings(): Record<string, unknown> {
    if (!this.defaultSettingsMerged) {
      this.mergeDefaults();
    }
    return { ...this.settings };
  }

  getSetting(key: string): unknown {
    if (!this.defaultSettingsMerged) {
      this.mergeDefaults();
    }
    return this.settings[key] ?? null;
  }

  setSettings(settings: Record<string, unknown>): this {
    this.settings = { ...settings };
    this.defaultSettingsMerged = false;
    return this;
  }

  setSetting(key: string, value: unknown): this {
    if (!this.defaultSettingsMerged) {
      this.mergeDefaults();
    }
    this.settings[key] = value;
    return this;
  }

  getThirdPartySetting(provider: string, key: string, defaultValue: unknown = null): unknown {
    return this.thirdPartySettings[provider]?.[key] ?? defaultValue;
  }

  setThirdPartySetting(provider: string, key: string, value: unknown): this {
    this.thirdPartySettings[provider] ??= {};
    this.thirdPartySettings[provider][key] = value;
    return this;
  }

  onDependencyRemoval(_dependencies: Record<string, string[]>): boolean {
    return false;
  }
}
