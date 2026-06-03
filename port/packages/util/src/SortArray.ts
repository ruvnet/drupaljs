/**
 * Provides generic sorting helper methods.
 *
 * Ported from Drupal\Component\Utility\SortArray. The comparator methods are
 * suitable as Array.prototype.sort callbacks.
 */

type Indexable = Record<string, unknown>;

function isIndexable(value: unknown): value is Indexable {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Natural, case-insensitive string comparison (PHP strnatcasecmp equivalent).
 *
 * Uses Intl.Collator with numeric collation so that "item2" sorts before
 * "item10".
 */
const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'accent',
});

export const SortArray = {
  /**
   * Sorts a structured array by the 'weight' element.
   */
  sortByWeightElement(a: unknown, b: unknown): number {
    return SortArray.sortByKeyInt(a, b, 'weight');
  },

  /**
   * Sorts a structured array by the '#weight' property.
   */
  sortByWeightProperty(a: unknown, b: unknown): number {
    return SortArray.sortByKeyInt(a, b, '#weight');
  },

  /**
   * Sorts a structured array by the 'title' key.
   */
  sortByTitleElement(a: unknown, b: unknown): number {
    return SortArray.sortByKeyString(a, b, 'title');
  },

  /**
   * Sorts a structured array by the '#title' property.
   */
  sortByTitleProperty(a: unknown, b: unknown): number {
    return SortArray.sortByKeyString(a, b, '#title');
  },

  /**
   * Sorts items by a string value at an arbitrary key (natural, ci).
   */
  sortByKeyString(a: unknown, b: unknown, key: string): number {
    const aTitle =
      isIndexable(a) && a[key] != null ? String(a[key]) : '';
    const bTitle =
      isIndexable(b) && b[key] != null ? String(b[key]) : '';
    return naturalCollator.compare(aTitle, bTitle);
  },

  /**
   * Sorts items by a numeric value at an arbitrary key.
   */
  sortByKeyInt(a: unknown, b: unknown, key: string): number {
    const aWeight = isIndexable(a) && a[key] != null ? Number(a[key]) : 0;
    const bWeight = isIndexable(b) && b[key] != null ? Number(b[key]) : 0;
    // Spaceship semantics, normalized to -1/0/1.
    if (aWeight < bWeight) return -1;
    if (aWeight > bWeight) return 1;
    return 0;
  },

  /**
   * Sorts an object recursively by key, alphabetically, in place.
   *
   * Arrays (lists) are left untouched since they are ordered by definition.
   * Returns the same reference for convenience.
   */
  sortByKeyRecursive<T extends Indexable | unknown[]>(data: T): T {
    if (isIndexable(data)) {
      const sortedKeys = Object.keys(data).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
      const snapshot: Indexable = {};
      for (const k of sortedKeys) {
        snapshot[k] = data[k];
        delete data[k];
      }
      for (const k of sortedKeys) {
        const value = snapshot[k];
        if (typeof value === 'object' && value !== null) {
          SortArray.sortByKeyRecursive(value as Indexable | unknown[]);
        }
        data[k] = value;
      }
    } else if (Array.isArray(data)) {
      for (const value of data) {
        if (typeof value === 'object' && value !== null) {
          SortArray.sortByKeyRecursive(value as Indexable | unknown[]);
        }
      }
    }
    return data;
  },
} as const;
