/**
 * Port of Drupal\Core\Cache\CacheTagsInvalidatorInterface.
 *
 * Source: core/lib/Drupal/Core/Cache/CacheTagsInvalidatorInterface.php
 */

/**
 * Defines required methods for classes wanting to handle cache tag changes.
 *
 * Services implementing this interface are registered with the central
 * `CacheTagsInvalidator`; cache backends implementing it are notified too.
 */
export interface CacheTagsInvalidatorInterface {
  /**
   * Marks cache items with any of the specified tags as invalid.
   *
   * @param tags - The list of tags to invalidate cache items for.
   */
  invalidateTags(tags: string[]): void;
}

/**
 * Port of Drupal\Core\Cache\CacheTagsPurgeInterface.
 *
 * Source: core/lib/Drupal/Core/Cache/CacheTagsPurgeInterface.php
 */
export interface CacheTagsPurgeInterface {
  /** Purges all invalidation data (used to reset checksum state). */
  purge(): void;
}
