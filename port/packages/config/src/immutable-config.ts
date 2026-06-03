/**
 * Port of Drupal\Core\Config\ImmutableConfig.
 *
 * A read-only configuration object. Mutating methods throw; use
 * ConfigFactory.getEditable() for a mutable object.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/ImmutableConfig.php
 */

import { Config } from './config.js';
import { ImmutableConfigException } from './exceptions.js';

export class ImmutableConfig extends Config {
  override set(key: string, _value: unknown): this {
    throw new ImmutableConfigException(
      `Can not set values on immutable configuration ${this.getName()}:${key}. ` +
        'Use ConfigFactory.getEditable() to retrieve a mutable configuration object',
    );
  }

  override clear(key: string): this {
    throw new ImmutableConfigException(
      `Can not clear ${key} key in immutable configuration ${this.getName()}. ` +
        'Use ConfigFactory.getEditable() to retrieve a mutable configuration object',
    );
  }

  override save(): this {
    throw new ImmutableConfigException(
      `Can not save immutable configuration ${this.getName()}. ` +
        'Use ConfigFactory.getEditable() to retrieve a mutable configuration object',
    );
  }

  override delete(): this {
    throw new ImmutableConfigException(
      `Can not delete immutable configuration ${this.getName()}. ` +
        'Use ConfigFactory.getEditable() to retrieve a mutable configuration object',
    );
  }
}
