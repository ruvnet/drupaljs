/**
 * Port of Drupal's cache context service interfaces.
 *
 * Sources:
 * - core/lib/Drupal/Core/Cache/Context/CacheContextInterface.php
 * - core/lib/Drupal/Core/Cache/Context/CalculatedCacheContextInterface.php
 */

import type { CacheableMetadata } from '../cacheable-metadata.js';

/**
 * A cache context service.
 *
 * Port of `Drupal\Core\Cache\Context\CacheContextInterface`. A context's token
 * (its service-id suffix) is replaced by the string `getContext()` returns,
 * generating the variation key for a cache item.
 */
export interface CacheContextInterface {
  /** The human-readable label (used by config forms). */
  getLabel(): string;
  /** The string representation used as the variation key. */
  getContext(): string;
  /** Cacheability metadata for the context (drives optimization/bubbling). */
  getCacheableMetadata(): CacheableMetadata;
}

/**
 * A calculated (parameterized) cache context service.
 *
 * Port of `Drupal\Core\Cache\Context\CalculatedCacheContextInterface`. The
 * parameter follows the token after a colon, e.g. `url.query_args:page`.
 */
export interface CalculatedCacheContextInterface {
  /** The human-readable label. */
  getLabel(): string;
  /**
   * The string representation for a given parameter.
   * @param parameter - The parameter, or `null` for "all possible values".
   */
  getContext(parameter?: string | null): string;
  /**
   * Cacheability metadata for a given parameter value.
   * @param parameter - The parameter, or `null` for "all possible values".
   */
  getCacheableMetadata(parameter?: string | null): CacheableMetadata;
}

/** A cache context service of either flavour. */
export type AnyCacheContext =
  | CacheContextInterface
  | CalculatedCacheContextInterface;
