/**
 * Port of Drupal\Component\Utility\NestedArray.
 *
 * Provides methods for working with nested objects of variable depth, mirroring
 * Drupal's NestedArray helper. Config data is modelled as plain objects keyed by
 * string; "integer keyed" arrays are represented as JavaScript arrays.
 *
 * @see drupal-core/core/lib/Drupal/Component/Utility/NestedArray.php
 */

export type ConfigData = Record<string, unknown>;

/** Result of a {@link NestedArray.getValue} lookup. */
export interface GetValueResult {
  /** The resolved value, or `undefined` when a parent key did not exist. */
  value: unknown;
  /** Whether every parent key in the path existed. */
  keyExists: boolean;
}

function isPlainArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isContainer(value: unknown): value is Record<string | number, unknown> {
  return typeof value === 'object' && value !== null;
}

export class NestedArray {
  /**
   * Retrieves a value from a nested structure with variable depth.
   *
   * Mirrors `NestedArray::getValue()`: a `keyExists` flag disambiguates a stored
   * `null`/`undefined` from a missing key.
   */
  static getValue(data: unknown, parents: Array<string | number>): GetValueResult {
    let ref: unknown = data;
    for (const parent of parents) {
      if (isContainer(ref) && Object.prototype.hasOwnProperty.call(ref, parent)) {
        ref = (ref as Record<string | number, unknown>)[parent];
      } else {
        return { value: undefined, keyExists: false };
      }
    }
    return { value: ref, keyExists: true };
  }

  /**
   * Sets a value in a nested structure, creating intermediate containers.
   *
   * Mirrors `NestedArray::setValue()`. When traversal hits an existing non-object
   * value, throws unless `force` is true (in which case it is replaced).
   */
  static setValue(
    data: Record<string, unknown>,
    parents: Array<string | number>,
    value: unknown,
    force = false,
  ): void {
    let ref: Record<string | number, unknown> = data;
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i]!;
      const isLast = i === parents.length - 1;
      if (isLast) {
        ref[parent] = value;
        return;
      }
      const next = ref[parent];
      if (next === undefined || next === null) {
        ref[parent] = {};
      } else if (!isContainer(next)) {
        if (!force) {
          throw new Error(`Cannot create key "${String(parent)}" on non-array value.`);
        }
        ref[parent] = {};
      }
      ref = ref[parent] as Record<string | number, unknown>;
    }
  }

  /**
   * Unsets a value in a nested structure.
   *
   * Mirrors `NestedArray::unsetValue()`. No-op when the path does not exist.
   */
  static unsetValue(data: Record<string, unknown>, parents: Array<string | number>): boolean {
    const path = [...parents];
    const unsetKey = path.pop();
    if (unsetKey === undefined) {
      return false;
    }
    const parent = NestedArray.getValue(data, path);
    if (
      parent.keyExists &&
      isContainer(parent.value) &&
      Object.prototype.hasOwnProperty.call(parent.value, unsetKey)
    ) {
      delete (parent.value as Record<string | number, unknown>)[unsetKey];
      return true;
    }
    return false;
  }

  /**
   * Determines whether a nested structure contains the requested key path.
   *
   * Mirrors `NestedArray::keyExists()`.
   */
  static keyExists(data: unknown, parents: Array<string | number>): boolean {
    return NestedArray.getValue(data, parents).keyExists;
  }

  /**
   * Recursively merges arrays/objects, replacing non-object values.
   *
   * Mirrors `NestedArray::mergeDeep()`.
   */
  static mergeDeep(...arrays: unknown[]): unknown {
    return NestedArray.mergeDeepArray(arrays);
  }

  /**
   * Recursively merges a list of arrays/objects.
   *
   * Mirrors `NestedArray::mergeDeepArray()`. Integer-keyed (array) values are
   * appended unless `preserveIntegerKeys` is true, in which case they are merged
   * by index.
   */
  static mergeDeepArray(arrays: unknown[], preserveIntegerKeys = false): unknown {
    // Determine result kind from the inputs: if every contributing value at this
    // level is an array, produce an array; otherwise produce an object.
    const allArrays = arrays.every((a) => a === undefined || a === null || isPlainArray(a));

    if (allArrays) {
      const result: unknown[] = [];
      for (const array of arrays) {
        if (!isPlainArray(array)) {
          continue;
        }
        array.forEach((value, index) => {
          if (!preserveIntegerKeys) {
            // Append, as PHP's array_merge_recursive renumbers integer keys.
            result.push(value);
          } else if (
            isContainer(result[index]) &&
            isContainer(value)
          ) {
            result[index] = NestedArray.mergeDeepArray([result[index], value], preserveIntegerKeys);
          } else {
            result[index] = value;
          }
        });
      }
      return result;
    }

    const result: Record<string, unknown> = {};
    for (const array of arrays) {
      if (!isContainer(array)) {
        continue;
      }
      for (const [key, value] of Object.entries(array)) {
        if (
          Object.prototype.hasOwnProperty.call(result, key) &&
          isContainer(result[key]) &&
          isContainer(value)
        ) {
          result[key] = NestedArray.mergeDeepArray([result[key], value], preserveIntegerKeys);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
}
