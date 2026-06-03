/**
 * Configuration events and a minimal event dispatcher contract.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigEvents.php
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigCrudEvent.php
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigRenameEvent.php
 */

import type { ConfigBase } from './config-base.js';

/** Event name constants. Port of Drupal\Core\Config\ConfigEvents. */
export const ConfigEvents = {
  SAVE: 'config.save',
  DELETE: 'config.delete',
  RENAME: 'config.rename',
} as const;

/**
 * Minimal event-dispatcher contract.
 *
 * TODO: Replace with the shared @drupaljs/event-dispatcher port of
 * Symfony's EventDispatcherInterface once it exists. Drupal returns the event
 * from dispatch(); we mirror that.
 */
export interface EventDispatcherInterface {
  dispatch<T extends object>(event: T, eventName?: string): T;
}

/** Wraps a configuration object for CRUD event listeners. Port of ConfigCrudEvent. */
export class ConfigCrudEvent {
  constructor(private readonly config: ConfigBase) {}

  /** Gets the configuration object that caused the event. */
  getConfig(): ConfigBase {
    return this.config;
  }

  /** Whether the value at the given key changed relative to original data. */
  isChanged(key: string): boolean {
    // Lazily typed: ConfigBase exposes get(); the override-aware getOriginal()
    // lives on Config, so guard for it.
    const original = (this.config as unknown as {
      getOriginal?: (key: string) => unknown;
    }).getOriginal;
    if (typeof original === 'function') {
      return this.config.get(key) !== original.call(this.config, key);
    }
    return true;
  }
}

/** Fired when a configuration object is renamed. Port of ConfigRenameEvent. */
export class ConfigRenameEvent extends ConfigCrudEvent {
  constructor(
    config: ConfigBase,
    private readonly oldName: string,
  ) {
    super(config);
  }

  /** Returns the previous configuration object name. */
  getOldName(): string {
    return this.oldName;
  }
}
