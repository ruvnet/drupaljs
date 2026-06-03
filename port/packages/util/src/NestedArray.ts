/**
 * Provides methods for working with nested structures of variable depth.
 *
 * Ported from Drupal\Component\Utility\NestedArray. PHP arrays map to either
 * plain objects (associative) or JS arrays (lists). Because JS distinguishes
 * the two natively, helpers operate on `unknown` containers and narrow at
 * runtime.
 */

export type PropertyKey = string | number;

/** A container that may be indexed by a parent key (object or array). */
type Container = Record<PropertyKey, unknown> | unknown[];

function isContainer(value: unknown): value is Container {
  return typeof value === 'object' && value !== null;
}

/**
 * Determines if a value is a plain (non-array) object.
 */
function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
  return isContainer(value) && !Array.isArray(value);
}

/**
 * Determines whether the keys of an object form a contiguous integer list
 * starting at 0 — the equivalent of PHP's array_is_list().
 */
function isList(value: unknown): value is unknown[] {
  if (Array.isArray(value)) {
    return true;
  }
  if (!isPlainObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.every((key, index) => key === String(index));
}

export const NestedArray = {
  /**
   * Retrieves a value from a nested structure with variable depth.
   *
   * @returns The requested nested value, or undefined if any parent key is
   *   missing. Use {@link NestedArray.keyExists} to disambiguate a stored
   *   undefined/null from a missing key.
   */
  getValue(data: Container, parents: PropertyKey[]): unknown {
    let ref: unknown = data;
    for (const parent of parents) {
      if (isContainer(ref) && Object.prototype.hasOwnProperty.call(ref, parent)) {
        ref = (ref as Record<PropertyKey, unknown>)[parent];
      } else {
        return undefined;
      }
    }
    return ref;
  },

  /**
   * Sets a value in a nested structure with variable depth.
   *
   * Intermediate containers are auto-created as plain objects. If a parent
   * along the path is a non-container value, an Error is thrown unless `force`
   * is true (in which case the value is replaced with a fresh container).
   */
  setValue(
    data: Container,
    parents: PropertyKey[],
    value: unknown,
    force = false,
  ): void {
    if (parents.length === 0) {
      return;
    }
    let ref = data as Record<PropertyKey, unknown>;
    for (let i = 0; i < parents.length - 1; i++) {
      const parent = parents[i] as PropertyKey;
      const current = ref[parent];
      if (current !== undefined && current !== null && !isContainer(current)) {
        if (!force) {
          throw new Error(`Cannot create key "${parent}" on non-array value.`);
        }
        ref[parent] = {};
      } else if (current === undefined || current === null) {
        ref[parent] = {};
      }
      ref = ref[parent] as Record<PropertyKey, unknown>;
    }
    ref[parents[parents.length - 1] as PropertyKey] = value;
  },

  /**
   * Unsets a value in a nested structure with variable depth.
   *
   * @returns Whether the key existed and was removed.
   */
  unsetValue(data: Container, parents: PropertyKey[]): boolean {
    if (parents.length === 0) {
      return false;
    }
    const unsetKey = parents[parents.length - 1] as PropertyKey;
    const parentPath = parents.slice(0, -1);
    const ref = NestedArray.getValue(data, parentPath);
    if (isContainer(ref) && Object.prototype.hasOwnProperty.call(ref, unsetKey)) {
      delete (ref as Record<PropertyKey, unknown>)[unsetKey];
      return true;
    }
    return false;
  },

  /**
   * Determines whether a nested structure contains the requested keys.
   */
  keyExists(data: Container, parents: PropertyKey[]): boolean {
    let ref: unknown = data;
    for (const parent of parents) {
      if (isContainer(ref) && Object.prototype.hasOwnProperty.call(ref, parent)) {
        ref = (ref as Record<PropertyKey, unknown>)[parent];
      } else {
        return false;
      }
    }
    return true;
  },

  /**
   * Merges multiple structures, recursively, and returns the merged result.
   *
   * Unlike a naive deep merge, when merging values that are not both
   * containers, the latter value replaces the former rather than merging.
   */
  mergeDeep(...structures: Container[]): Record<PropertyKey, unknown> | unknown[] {
    return NestedArray.mergeDeepArray(structures);
  },

  /**
   * Merges multiple structures provided as a single array.
   *
   * @param structures Containers to merge.
   * @param preserveIntegerKeys If false (default), integer keys are renumbered
   *   and appended like PHP's array_merge_recursive(); if true, integer keys
   *   are preserved and merged.
   */
  mergeDeepArray(
    structures: Container[],
    preserveIntegerKeys = false,
  ): Record<PropertyKey, unknown> | unknown[] {
    const result: Record<PropertyKey, unknown> = {};
    let nextIndex = 0;

    const isIntegerKey = (key: string): boolean => /^(0|[1-9][0-9]*)$/.test(key);

    for (const structure of structures) {
      if (!isContainer(structure)) {
        continue;
      }
      const entries = Array.isArray(structure)
        ? structure.map((v, i) => [String(i), v] as const)
        : Object.entries(structure);

      for (const [key, value] of entries) {
        if (isIntegerKey(key) && !preserveIntegerKeys) {
          // Renumber integer keys, appending the value.
          result[nextIndex++] = value;
        } else if (
          Object.prototype.hasOwnProperty.call(result, key) &&
          isContainer(result[key]) &&
          isContainer(value)
        ) {
          result[key] = NestedArray.mergeDeepArray(
            [result[key] as Container, value as Container],
            preserveIntegerKeys,
          );
        } else {
          result[key] = value;
        }
      }
    }

    // If every key is a contiguous integer, return a real array to mirror PHP's
    // list semantics.
    return isList(result) ? Object.values(result) : result;
  },

  /**
   * Filters a nested structure recursively.
   *
   * @param data The structure to filter.
   * @param callback Predicate applied to each leaf/branch value; if omitted,
   *   falsy values are removed (mirroring PHP array_filter()).
   */
  filter(
    data: Container,
    callback?: (value: unknown) => boolean,
  ): Record<PropertyKey, unknown> | unknown[] {
    const predicate = callback ?? ((v: unknown) => Boolean(v));
    const entries = Array.isArray(data)
      ? data.map((v, i) => [String(i), v] as const)
      : Object.entries(data);

    const out: Record<PropertyKey, unknown> = {};
    for (const [key, value] of entries) {
      if (!predicate(value)) {
        continue;
      }
      out[key] = isContainer(value)
        ? NestedArray.filter(value as Container, callback)
        : value;
    }
    return isList(data) ? Object.values(out) : out;
  },
} as const;
