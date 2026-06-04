import type { ShortcutEntityStorageInterface } from '../ShortcutSetStorage.js';
import { Shortcut } from './Shortcut.js';
import type { ShortcutInterface, ShortcutSetInterface } from './interfaces.js';

/** Plain values used to construct a {@link ShortcutSet}. */
export interface ShortcutSetValues {
  /** Machine name (config-entity id). */
  id: string;
  /** Human-readable label. */
  label: string;
}

/**
 * Defines the Shortcut set configuration entity.
 *
 * Ports `Drupal\shortcut\Entity\ShortcutSet`. In core `getShortcuts()` and
 * `resetLinkWeights()` reach into the global container for the `shortcut`
 * storage; here that storage is injected so the set is unit-testable. It is
 * optional: a set with no storage simply has no live shortcuts (e.g. config
 * import / listing contexts).
 */
export class ShortcutSet implements ShortcutSetInterface {
  private readonly _id: string;
  private readonly _label: string;

  constructor(
    values: ShortcutSetValues,
    private readonly shortcutStorage?: ShortcutEntityStorageInterface,
  ) {
    this._id = values.id;
    this._label = values.label;
  }

  id(): string {
    return this._id;
  }

  label(): string {
    return this._label;
  }

  /** Canonical config-entity cache tag for this set. */
  getCacheTags(): string[] {
    return [`config:shortcut.set.${this._id}`];
  }

  getCacheTagsToInvalidate(): string[] {
    return this.getCacheTags();
  }

  /**
   * Returns all shortcuts in this set, sorted by {@link Shortcut.sort}.
   * Ports `ShortcutSet::getShortcuts()`.
   */
  getShortcuts(): ShortcutInterface[] {
    if (!this.shortcutStorage) {
      return [];
    }
    const shortcuts = this.shortcutStorage.loadByProperties({ shortcut_set: this._id });
    return [...shortcuts].sort(Shortcut.sort);
  }

  /**
   * Resets link weights to match the current sorted order, starting at -49.
   * Ports `ShortcutSet::resetLinkWeights()`.
   */
  resetLinkWeights(): this {
    let weight = -50;
    for (const shortcut of this.getShortcuts()) {
      shortcut.setWeight(++weight);
      this.shortcutStorage?.save(shortcut);
    }
    return this;
  }
}
