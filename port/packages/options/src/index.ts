/**
 * @drupaljs/options — TypeScript port of Drupal's Options module.
 *
 * Ported from core/modules/options (Drupal 11). Provides the list field types
 * (list_integer / list_string / list_float) with allowed-values parsing,
 * config (de)serialization, an allowed-values provider mechanism, and the
 * OptionsProvider interface (possible/settable values & options).
 */

// Contracts / interfaces.
export type {
  AccountInterface,
  AllowedValuesFunction,
  FieldStorageDefinition,
  FlatOptionsArray,
  ListStorageSettings,
  OptionsArray,
  OptionsProviderInterface,
  StructuredAllowedValue,
} from './contracts.js';

// OptGroup helper.
export { flattenOptions } from './opt-group.js';

// Allowed-values resolution (options_allowed_values).
export { optionsAllowedValues } from './allowed-values.js';
export type { AllowedValuesProviders } from './allowed-values.js';

// Field types.
export {
  ListItemBase,
  ListIntegerItem,
  ListStringItem,
  ListFloatItem,
} from './field-types.js';
export type { ListFieldSchema } from './field-types.js';
