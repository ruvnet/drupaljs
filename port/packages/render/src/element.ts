/**
 * Helper methods for render elements.
 *
 * Port of the parts of Drupal\Core\Render\Element this package needs: telling
 * properties (`#`-prefixed keys) from children, and ordering children by
 * `#weight` while preserving insertion order for ties.
 */

import type { RenderArray } from './render-array.js';

export const Element = {
  /** Is the key a property (begins with '#')? */
  property(key: string): boolean {
    return key.length > 0 && key[0] === '#';
  },

  /** Is the key a child (does not begin with '#')? */
  child(key: string): boolean {
    return !(key.length > 0 && key[0] === '#');
  },

  /**
   * Identifies the children of an element, optionally sorted by `#weight`.
   *
   * When `sort` is true and at least one child has a `#weight`, children are
   * reordered in-place on `elements` (stable: ties keep insertion order) and
   * `#sorted` is set. Returns the (possibly sorted) list of child keys.
   *
   * Throws if a child value is present but not an object (parity with Drupal).
   */
  children(elements: RenderArray, sort = false): string[] {
    // Don't re-sort an already-sorted element.
    const effectiveSort = elements['#sorted'] !== undefined ? !elements['#sorted'] : sort;

    const keys = Object.keys(elements);
    const childWeights = new Map<string, number>();
    let sortable = false;
    const count = keys.length;
    let i = 0;

    for (const key of keys) {
      if (Element.child(key)) {
        const value = elements[key];
        if (isObject(value)) {
          const child = value as RenderArray;
          let weight = 0;
          if (typeof child['#weight'] === 'number') {
            weight = child['#weight'];
            sortable = true;
          }
          // Preserve insertion order within equal weights (three-digit precision).
          childWeights.set(key, Math.floor(weight * 1000) + i / count);
        } else if (value !== undefined && value !== null) {
          throw new TypeError(
            `"${key}" is an invalid render array key. Value should be an array but got a ${typeof value}.`,
          );
        }
      }
      i++;
    }

    if (effectiveSort && sortable) {
      const ordered = [...childWeights.entries()].sort((a, b) => a[1] - b[1]);
      // Reorder keys in-place on the element to persist the sort.
      for (const [key] of ordered) {
        const value = elements[key];
        delete elements[key];
        elements[key] = value;
      }
      elements['#sorted'] = true;
      return ordered.map(([key]) => key);
    }

    return [...childWeights.keys()];
  },
} as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
