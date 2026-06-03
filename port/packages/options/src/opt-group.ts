/**
 * Port of Drupal\Core\Form\OptGroup.
 *
 * Flattens hierarchical option arrays (opt-groups) into a single-level map of
 * value -> label.
 */
import type { OptionsArray, FlatOptionsArray } from './contracts.js';

/**
 * Flattens nested opt-group arrays into a single-level options map.
 *
 * Mirrors OptGroup::flattenOptions(). When keys collide across groups the last
 * one wins (matching PHP associative-array assignment).
 *
 * @param array - The options map, possibly containing nested group maps.
 * @returns A flat map of value -> label.
 */
export function flattenOptions(array: OptionsArray): FlatOptionsArray {
  const options: FlatOptionsArray = {};
  doFlattenOptions(array, options);
  return options;
}

function doFlattenOptions(array: OptionsArray, options: FlatOptionsArray): void {
  for (const [key, value] of Object.entries(array)) {
    if (typeof value === 'object' && value !== null) {
      doFlattenOptions(value, options);
    } else {
      options[key] = value;
    }
  }
}
