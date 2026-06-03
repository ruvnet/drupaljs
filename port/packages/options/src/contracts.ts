/**
 * Contracts for @drupaljs/options.
 *
 * Ported from Drupal\options and Drupal\Core\TypedData\OptionsProviderInterface
 * (Drupal 11 core, core/modules/options).
 */

// TODO: replace with the shared `@drupaljs/typed-data` export once
// OptionsProviderInterface is published there. Defined locally to avoid a
// cross-package contract that does not yet exist (ADR-0017).
/**
 * Minimal stand-in for Drupal\Core\Session\AccountInterface.
 *
 * The options provider only needs an opaque account handle for filtering; the
 * full account contract lives in another (not-yet-ported) package.
 */
export interface AccountInterface {
  /** The account user id. */
  id(): number | string;
}

/**
 * An "allowed values" map: raw stored value (key) -> display label.
 *
 * Keys are always strings at the map level (JS object keys), mirroring PHP's
 * array-key coercion. The typed key value is recovered via the field type's
 * cast. Labels may be a nested {@link OptionsArray} to represent opt-groups.
 */
export interface OptionsArray {
  [value: string]: string | OptionsArray;
}

/**
 * A flat allowed-values map with all opt-groups flattened away.
 */
export type FlatOptionsArray = Record<string, string>;

/**
 * Storage settings for a list field, mirroring ListItemBase storage settings.
 */
export interface ListStorageSettings {
  /** Map of stored value -> label. */
  allowed_values: OptionsArray;
  /**
   * Optional callback id/name that dynamically supplies allowed values.
   * When set, it overrides `allowed_values`.
   */
  allowed_values_function: string;
}

/**
 * One structured allowed-value entry, mirroring the config-stored form used by
 * ListItemBase::structureAllowedValues().
 */
export interface StructuredAllowedValue {
  value: string | number;
  label: string | StructuredAllowedValue[];
}

/**
 * A field storage definition, reduced to what options needs.
 *
 * TODO: replace with the shared `@drupaljs/field` FieldStorageDefinition once
 * that package exists.
 */
export interface FieldStorageDefinition {
  /** Returns a named setting value. */
  getSetting<K extends keyof ListStorageSettings>(name: K): ListStorageSettings[K];
  getTargetEntityTypeId(): string;
  getName(): string;
}

/**
 * A function that dynamically resolves allowed values.
 *
 * Mirrors callback_allowed_values_function(). `cacheable` is an out-param in
 * PHP; here the callback may return `{ values, cacheable }`.
 */
export type AllowedValuesFunction = (
  definition: FieldStorageDefinition,
  entity?: unknown,
) => OptionsArray | { values: OptionsArray; cacheable: boolean };

/**
 * Port of Drupal\Core\TypedData\OptionsProviderInterface.
 *
 * Possible values describe values existing data might have; settable values are
 * what a user is allowed to set.
 */
export interface OptionsProviderInterface {
  getPossibleValues(account?: AccountInterface): Array<string | number>;
  getPossibleOptions(account?: AccountInterface): OptionsArray;
  getSettableValues(account?: AccountInterface): Array<string | number>;
  getSettableOptions(account?: AccountInterface): OptionsArray;
}
