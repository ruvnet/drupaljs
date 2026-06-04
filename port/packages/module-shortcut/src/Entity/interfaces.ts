import type { UrlLike } from '../contracts.js';

/**
 * Provides an interface defining a shortcut entity.
 *
 * Ports `Drupal\shortcut\ShortcutInterface` (content entity). The full
 * `ContentEntityInterface` it extends in core is reduced here to the surface the
 * shortcut module actually exercises.
 */
export interface ShortcutInterface {
  /** Numeric entity id (assigned on save). */
  id(): number | null;
  /** Bundle = the owning shortcut set machine name. */
  bundle(): string;
  /** Returns the title of this shortcut. */
  getTitle(): string;
  /** Sets the title of this shortcut; returns `this`. */
  setTitle(title: string): this;
  /** Returns the weight among shortcuts in the same set. */
  getWeight(): number;
  /** Sets the weight among shortcuts in the same set; returns `this`. */
  setWeight(weight: number): this;
  /** Returns the URL object pointing to the configured route. */
  getUrl(): UrlLike;
  /** Cache tags to invalidate (the owning set's tags). */
  getCacheTagsToInvalidate(): string[];
}

/**
 * Provides an interface defining a shortcut set entity.
 *
 * Ports `Drupal\shortcut\ShortcutSetInterface` (config entity / bundle).
 */
export interface ShortcutSetInterface {
  /** Machine name of the set (config-entity id). */
  id(): string;
  /** Human-readable label. */
  label(): string;
  /** Cache tags for this set, e.g. `config:shortcut.set.<id>`. */
  getCacheTags(): string[];
  /** Cache tags to invalidate when the set changes. */
  getCacheTagsToInvalidate(): string[];
  /**
   * Resets the link weights to match their current sorted order; returns `this`.
   */
  resetLinkWeights(): this;
  /** Returns all shortcuts in this set, sorted correctly. */
  getShortcuts(): ShortcutInterface[];
}
