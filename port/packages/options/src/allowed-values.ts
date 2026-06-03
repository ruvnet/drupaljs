/**
 * Port of options_allowed_values() from options.module.
 *
 * Resolves the allowed values for a list field, either from the static
 * `allowed_values` setting or by invoking a registered allowed-values provider
 * function (`allowed_values_function`).
 */
import type {
  AllowedValuesFunction,
  FieldStorageDefinition,
  OptionsArray,
} from './contracts.js';

/**
 * A registry mapping provider ids to allowed-values functions.
 *
 * In Drupal the function name is resolved against PHP's callable space; in JS
 * we resolve it against an explicit registry passed by the caller.
 */
export type AllowedValuesProviders = Record<string, AllowedValuesFunction>;

/**
 * Returns the array of allowed values for a list field.
 *
 * Keys are the raw stored values, values are the display labels. Labels are
 * NOT sanitized (callers must sanitize before output).
 *
 * @param definition - The field storage definition.
 * @param entity - (optional) The specific entity for context-aware providers.
 * @param providers - (optional) Registry of allowed-values provider functions.
 * @returns The resolved allowed-values map.
 * @throws If an `allowed_values_function` is set but no matching provider is
 *   registered.
 */
export function optionsAllowedValues(
  definition: FieldStorageDefinition,
  entity?: unknown,
  providers: AllowedValuesProviders = {},
): OptionsArray {
  const fn = definition.getSetting('allowed_values_function');

  if (fn) {
    const provider = providers[fn];
    if (!provider) {
      throw new Error(`Unknown allowed values function: "${fn}".`);
    }
    const result = provider(definition, entity);
    if (isCacheableResult(result)) {
      return result.values;
    }
    return result;
  }

  return definition.getSetting('allowed_values');
}

/** Type guard for the `{ values, cacheable }` provider return shape. */
function isCacheableResult(
  result: OptionsArray | { values: OptionsArray; cacheable: boolean },
): result is { values: OptionsArray; cacheable: boolean } {
  return (
    typeof (result as { cacheable?: unknown }).cacheable === 'boolean' &&
    typeof (result as { values?: unknown }).values === 'object'
  );
}
