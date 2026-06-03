/**
 * @drupaljs/text — Drupal text module port.
 *
 * Field types (`text`, `text_long`, `text_with_summary`), the TextProcessed
 * computed property, the TextSummary trimmer, and the processed-text /
 * trimmed formatters built on the filter pipeline. Ref: core/modules/text.
 */
export type {
  FilterPipeline,
  FilterProcessResult,
  FilterFormat,
  FilterInfo,
  TextItemValue,
  TextStorageSettings,
  TextFieldSettings,
  TextWithSummaryFieldSettings,
  TextFieldTypeDefinition,
  FieldSchema,
  SchemaColumn,
  Constraint,
} from './contracts.js';

export {
  textFieldType,
  textLongFieldType,
  textWithSummaryFieldType,
  textFieldTypes,
} from './field-types.js';

export { createTextProcessed } from './processed-text.js';
export type { TextProcessed, TextProcessedOptions } from './processed-text.js';

export { createTextSummary } from './text-summary.js';
export type { TextSummary } from './text-summary.js';

export {
  textDefaultFormatter,
  createTextTrimmedFormatter,
} from './formatter.js';
export type {
  TextDefaultFormatter,
  TextTrimmedFormatter,
  TrimmedFormatterSettings,
} from './formatter.js';
