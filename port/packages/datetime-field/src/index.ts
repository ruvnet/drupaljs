/**
 * @drupaljs/datetime-field — public API.
 *
 * A TypeScript port of Drupal core's `datetime` and `datetime_range` field
 * subsystems: the `datetime` / `daterange` field types, their UTC storage
 * string codec, and the plain/custom/default formatters.
 *
 * Ref: core/modules/datetime, core/modules/datetime_range.
 */

// Constants, enums, and storage-format patterns.
export {
  STORAGE_TIMEZONE,
  DATETIME_STORAGE_FORMAT,
  DATE_STORAGE_FORMAT,
  DateTimeType,
  DateTimeRangeDisplayOptions,
} from './constants.js';

// Storage string codec (strict parse/format/validate).
export {
  isTimeBearing,
  formatStorage,
  parseStorage,
  isValidStorageValue,
} from './DateTimeStorageFormat.js';

// PHP-pattern date formatting helper.
export { phpDateFormat } from './phpDateFormat.js';

// `datetime` field type.
export {
  DateTimeItem,
  storageFormatFor,
} from './DateTimeItem.js';
export type {
  DateTimeStorageSettings,
  ColumnSchema,
  FieldSchema,
  PropertyDefinition,
  DateTimeItemValue,
} from './DateTimeItem.js';

// `daterange` field type.
export { DateRangeItem } from './DateRangeItem.js';
export type { DateRangeItemValue } from './DateRangeItem.js';

// Formatters.
export {
  DateTimePlainFormatter,
  DateTimeCustomFormatter,
  DateRangeDefaultFormatter,
} from './formatters.js';
export type {
  DateTimeFormatterBaseSettings,
  DateTimeCustomFormatterSettings,
  DateRangeFormatterSettings,
} from './formatters.js';
