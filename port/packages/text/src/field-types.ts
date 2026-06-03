/**
 * Text field type plugins: `text`, `text_long`, `text_with_summary`.
 * Ports core/modules/text/src/Plugin/Field/FieldType/*.
 */
import type {
  Constraint,
  FieldSchema,
  TextFieldTypeDefinition,
  TextItemValue,
} from './contracts.js';

const BASE_PROPERTIES = ['value', 'format', 'processed'] as const;

const isValueEmpty = (value: TextItemValue): boolean =>
  value.value === null || value.value === undefined || value.value === '';

/** TextItemBase::defaultFieldSettings(). */
const baseFieldSettings = (): { allowed_formats: string[] } => ({ allowed_formats: [] });

/** Plugin implementation of the 'text' field type (TextItem). */
export const textFieldType: TextFieldTypeDefinition = {
  id: 'text',
  label: 'Short text',
  category: 'formatted_text',
  defaultWidget: 'text_textfield',
  defaultFormatter: 'text_default',

  defaultStorageSettings: () => ({ max_length: 255 }),
  defaultFieldSettings: baseFieldSettings,

  schema: (settings): FieldSchema => ({
    columns: {
      value: { type: 'varchar', length: (settings.max_length as number) ?? 255 },
      format: { type: 'varchar', length: 255 },
    },
    indexes: { format: ['format'] },
  }),

  propertyNames: () => [...BASE_PROPERTIES],
  isEmpty: isValueEmpty,

  getConstraints: (settings): Constraint[] => {
    const max = settings.max_length as number | undefined;
    if (!max) return [];
    return [
      {
        name: 'Length',
        options: {
          max,
          maxMessage: `The text may not be longer than ${max} characters.`,
        },
      },
    ];
  },
};

/** Plugin implementation of the 'text_long' field type (TextLongItem). */
export const textLongFieldType: TextFieldTypeDefinition = {
  id: 'text_long',
  label: 'Long text',
  category: 'formatted_text',
  defaultWidget: 'text_textarea',
  defaultFormatter: 'text_default',

  defaultStorageSettings: () => ({}),
  defaultFieldSettings: baseFieldSettings,

  schema: (): FieldSchema => ({
    columns: {
      value: { type: 'text', size: 'big' },
      format: { type: 'varchar_ascii', length: 255 },
    },
    indexes: { format: ['format'] },
  }),

  propertyNames: () => [...BASE_PROPERTIES],
  isEmpty: isValueEmpty,

  getConstraints: () => [],
};

/** Plugin implementation of the 'text_with_summary' field type. */
export const textWithSummaryFieldType: TextFieldTypeDefinition = {
  id: 'text_with_summary',
  label: 'Long text with summary',
  category: 'formatted_text',
  defaultWidget: 'text_textarea_with_summary',
  defaultFormatter: 'text_default',

  defaultStorageSettings: () => ({}),
  defaultFieldSettings: () => ({
    ...baseFieldSettings(),
    display_summary: false,
    required_summary: false,
  }),

  schema: (): FieldSchema => ({
    columns: {
      value: { type: 'text', size: 'big' },
      summary: { type: 'text', size: 'big' },
      format: { type: 'varchar_ascii', length: 255 },
    },
    indexes: { format: ['format'] },
  }),

  propertyNames: () => [...BASE_PROPERTIES, 'summary', 'summary_processed'],

  isEmpty: (value): boolean =>
    isValueEmpty(value) &&
    (value.summary === null || value.summary === undefined || value.summary === ''),

  getConstraints: (settings): Constraint[] => {
    if (!settings.required_summary) return [];
    return [
      {
        name: 'NotNull',
        options: { property: 'summary', message: 'The summary field is required.' },
      },
    ];
  },
};

/** All text field types keyed by id (plugin manager-style lookup). */
export const textFieldTypes = {
  text: textFieldType,
  text_long: textLongFieldType,
  text_with_summary: textWithSummaryFieldType,
} as const;
