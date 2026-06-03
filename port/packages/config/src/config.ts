/**
 * Port of Drupal\Core\Config\Config (with StorableConfigBase folded in).
 *
 * The default configuration object: storage-backed, override-aware, and event
 * emitting on save/delete. Schema-based value casting (TypedConfigManager) is
 * out of scope for this package — see typed-config.ts.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/Config.php
 * @see drupal-core/core/lib/Drupal/Core/Config/StorableConfigBase.php
 */

import { ConfigBase } from './config-base.js';
import { NestedArray, type ConfigData } from './nested-array.js';
import { Cache } from './cacheability.js';
import { StorageInterface } from './storage.js';
import {
  ConfigCrudEvent,
  ConfigEvents,
  type EventDispatcherInterface,
} from './events.js';
import {
  NullTypedConfigManager,
  type TypedConfigManagerInterface,
} from './typed-config.js';

export class Config extends ConfigBase {
  protected isNewFlag = true;
  protected originalData: ConfigData = {};

  private overriddenData: ConfigData | undefined;
  private moduleOverrides: ConfigData | undefined;
  private settingsOverrides: ConfigData | undefined;

  constructor(
    name: string,
    protected readonly storage: StorageInterface,
    protected readonly eventDispatcher: EventDispatcherInterface,
    protected readonly typedConfigManager: TypedConfigManagerInterface = new NullTypedConfigManager(),
  ) {
    super();
    this.name = name;
  }

  /** Retrieves the storage backing this configuration object. */
  getStorage(): StorageInterface {
    return this.storage;
  }

  /** Initializes the object with pre-loaded data (marks it as not new). */
  initWithData(data: ConfigData): this {
    this.isNewFlag = false;
    this.data = data;
    this.originalData = data;
    this.resetOverriddenData();
    return this;
  }

  /** Whether this configuration object does not yet exist in storage. */
  isNew(): boolean {
    return this.isNewFlag;
  }

  /** Returns the raw (non-overridden) data. Port of getRawData(). */
  getRawData(): ConfigData {
    return this.data;
  }

  override get(key = ''): unknown {
    if (this.overriddenData === undefined) {
      this.setOverriddenData();
    }
    const source = this.overriddenData!;
    if (key === '') {
      return source;
    }
    const parts = key.split('.');
    if (parts.length === 1) {
      return source[key];
    }
    const result = NestedArray.getValue(source, parts);
    return result.keyExists ? result.value : undefined;
  }

  override setData(data: ConfigData): this {
    super.setData(data);
    this.resetOverriddenData();
    return this;
  }

  override set(key: string, value: unknown): this {
    super.set(key, value);
    this.resetOverriddenData();
    return this;
  }

  override clear(key: string): this {
    super.clear(key);
    this.resetOverriddenData();
    return this;
  }

  /** Sets settings.php overrides (highest precedence). */
  setSettingsOverride(data: ConfigData): this {
    this.settingsOverrides = data;
    this.resetOverriddenData();
    return this;
  }

  /** Sets module overrides (below settings overrides). */
  setModuleOverride(data: ConfigData): this {
    this.moduleOverrides = data;
    this.resetOverriddenData();
    return this;
  }

  private setOverriddenData(): void {
    let merged: ConfigData = this.data;
    if (this.moduleOverrides) {
      merged = NestedArray.mergeDeepArray([merged, this.moduleOverrides], true) as ConfigData;
    }
    if (this.settingsOverrides) {
      merged = NestedArray.mergeDeepArray([merged, this.settingsOverrides], true) as ConfigData;
    }
    this.overriddenData = merged;
  }

  private resetOverriddenData(): void {
    this.overriddenData = undefined;
  }

  /**
   * Saves the configuration object to storage and fires a SAVE event.
   *
   * @throws {ConfigNameException} If the name is invalid.
   */
  save(): this {
    ConfigBase.validateName(this.name);
    this.resetOverriddenData();
    this.storage.write(this.name, this.data);
    if (!this.isNewFlag) {
      Cache.invalidateTags(this.getCacheTags());
    }
    this.isNewFlag = false;
    // TODO: dispatch ConfigCollectionEvents.SAVE_IN_COLLECTION for non-default
    // collections once collection events are ported.
    this.eventDispatcher.dispatch(new ConfigCrudEvent(this), ConfigEvents.SAVE);
    this.originalData = this.data;
    return this;
  }

  /** Deletes the configuration object from storage and fires a DELETE event. */
  delete(): this {
    this.data = {};
    this.storage.delete(this.name);
    Cache.invalidateTags(this.getCacheTags());
    this.isNewFlag = true;
    this.resetOverriddenData();
    this.eventDispatcher.dispatch(new ConfigCrudEvent(this), ConfigEvents.DELETE);
    this.originalData = this.data;
    return this;
  }

  /**
   * Gets original (pre-change) data, optionally with overrides applied.
   *
   * @param key A dotted key, or '' for the whole object.
   * @param applyOverrides Whether to layer overrides on the original data.
   */
  getOriginal(key = '', applyOverrides = true): unknown {
    let original: ConfigData = this.originalData;
    if (applyOverrides) {
      if (this.moduleOverrides) {
        original = NestedArray.mergeDeepArray([original, this.moduleOverrides], true) as ConfigData;
      }
      if (this.settingsOverrides) {
        original = NestedArray.mergeDeepArray(
          [original, this.settingsOverrides],
          true,
        ) as ConfigData;
      }
    }
    if (key === '') {
      return original;
    }
    const parts = key.split('.');
    if (parts.length === 1) {
      return original[key];
    }
    const result = NestedArray.getValue(original, parts);
    return result.keyExists ? result.value : undefined;
  }

  /** Whether any overrides apply, overall or for a specific dotted key. */
  hasOverrides(key = ''): boolean {
    if (key === '') {
      return !this.isEmpty(this.moduleOverrides) || !this.isEmpty(this.settingsOverrides);
    }
    const parts = key.split('.');
    let exists = false;
    if (this.moduleOverrides) {
      exists = NestedArray.keyExists(this.moduleOverrides, parts);
    }
    if (!exists && this.settingsOverrides) {
      exists = NestedArray.keyExists(this.settingsOverrides, parts);
    }
    return exists;
  }

  private isEmpty(data: ConfigData | undefined): boolean {
    return !data || Object.keys(data).length === 0;
  }
}
