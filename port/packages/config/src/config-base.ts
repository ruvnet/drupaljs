/**
 * Port of Drupal\Core\Config\ConfigBase.
 *
 * Base class for configuration objects with get/set support and cacheability.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigBase.php
 */

import { NestedArray, type ConfigData } from './nested-array.js';
import { Cache, CACHE_PERMANENT, type CacheableDependencyInterface } from './cacheability.js';
import { ConfigNameException, ConfigValueException } from './exceptions.js';

/** Disallowed characters in a config name: : ? * < > ' " / \ */
const INVALID_NAME_CHARS = /[:?*<>"'/\\]/;

export abstract class ConfigBase implements CacheableDependencyInterface {
  /** The maximum length of a configuration object name. */
  static readonly MAX_NAME_LENGTH = 250;

  protected name = '';
  protected data: ConfigData = {};

  protected cacheTags: string[] = [];
  protected cacheContexts: string[] = [];
  protected cacheMaxAge: number = CACHE_PERMANENT;

  /** Returns the name of this configuration object. */
  getName(): string {
    return this.name;
  }

  /** Sets the name of this configuration object. */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Validates the configuration object name.
   *
   * @throws {ConfigNameException}
   */
  static validateName(name: string): void {
    if (!name.includes('.')) {
      throw new ConfigNameException(`Missing namespace in Config object name ${name}.`);
    }
    if (name.length > ConfigBase.MAX_NAME_LENGTH) {
      throw new ConfigNameException(
        `Config object name ${name} exceeds maximum allowed length of ${ConfigBase.MAX_NAME_LENGTH} characters.`,
      );
    }
    if (INVALID_NAME_CHARS.test(name)) {
      throw new ConfigNameException(`Invalid character in Config object name ${name}.`);
    }
  }

  /**
   * Gets data from this configuration object using a dotted key.
   *
   * An empty key returns the whole data object; `foo.bar` resolves nested keys.
   */
  get(key = ''): unknown {
    if (key === '') {
      return this.data;
    }
    const parts = key.split('.');
    if (parts.length === 1) {
      return this.data[key];
    }
    const result = NestedArray.getValue(this.data, parts);
    return result.keyExists ? result.value : undefined;
  }

  /**
   * Replaces all data on this configuration object.
   *
   * @throws {ConfigValueException} If any key at any depth contains a dot.
   */
  setData(data: ConfigData): this {
    this.validateKeys(data);
    this.data = data;
    return this;
  }

  /**
   * Sets a value using a dotted key.
   *
   * @throws {ConfigValueException} If `value` is an object whose keys contain a dot.
   */
  set(key: string, value: unknown): this {
    if (this.isObject(value)) {
      this.validateKeys(value);
    }
    const parts = key.split('.');
    if (parts.length === 1) {
      this.data[key] = value;
    } else {
      NestedArray.setValue(this.data, parts, value);
    }
    return this;
  }

  /** Unsets a value using a dotted key. */
  clear(key: string): this {
    const parts = key.split('.');
    if (parts.length === 1) {
      delete this.data[key];
    } else {
      NestedArray.unsetValue(this.data, parts);
    }
    return this;
  }

  /** Recursively merges data into this configuration object (integer keys preserved). */
  merge(dataToMerge: ConfigData): this {
    this.setData(NestedArray.mergeDeepArray([this.data, dataToMerge], true) as ConfigData);
    return this;
  }

  getCacheContexts(): string[] {
    return this.cacheContexts;
  }

  getCacheTags(): string[] {
    return Cache.mergeTags([`config:${this.name}`], this.cacheTags);
  }

  getCacheMaxAge(): number {
    return this.cacheMaxAge;
  }

  /** Adds a cacheable dependency's metadata to this object. */
  addCacheableDependency(dependency: CacheableDependencyInterface | null | undefined): this {
    if (!dependency) {
      return this;
    }
    this.cacheTags = Cache.mergeTags(this.cacheTags, dependency.getCacheTags());
    this.cacheContexts = Cache.mergeContexts(this.cacheContexts, dependency.getCacheContexts());
    this.cacheMaxAge = Cache.mergeMaxAges(this.cacheMaxAge, dependency.getCacheMaxAge());
    return this;
  }

  protected validateKeys(data: ConfigData): void {
    for (const [key, value] of Object.entries(data)) {
      if (key.includes('.')) {
        throw new ConfigValueException(`${key} key contains a dot which is not supported.`);
      }
      if (this.isObject(value)) {
        this.validateKeys(value);
      }
    }
  }

  protected isObject(value: unknown): value is ConfigData {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
