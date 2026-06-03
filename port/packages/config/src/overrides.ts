/**
 * Port of Drupal\Core\Config\ConfigFactoryOverrideInterface.
 *
 * A config-factory override contributes override data (and cacheable metadata)
 * for named configuration objects, layered beneath settings.php overrides.
 *
 * @see drupal-core/core/lib/Drupal/Core/Config/ConfigFactoryOverrideInterface.php
 */

import type { ConfigData } from './nested-array.js';
import type { CacheableMetadata } from './cacheability.js';

export interface ConfigFactoryOverrideInterface {
  /**
   * Returns override data keyed by configuration name.
   *
   * @param names The configuration names being loaded.
   */
  loadOverrides(names: string[]): Record<string, ConfigData>;

  /** A string appended to the static cache key for override-aware caching. */
  getCacheSuffix(): string;

  /** Cacheable metadata contributed by this override for the given name. */
  getCacheableMetadata(name: string): CacheableMetadata;
}
