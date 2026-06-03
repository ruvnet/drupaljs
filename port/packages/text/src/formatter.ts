/**
 * Text field formatters: `text_default`, `text_trimmed`, and
 * `text_summary_or_trimmed`. Ports
 * core/modules/text/src/Plugin/Field/FieldFormatter/*.
 */
import type { FilterPipeline, TextItemValue } from './contracts.js';
import { createTextSummary } from './text-summary.js';

const TEXT_FIELD_TYPES = ['text', 'text_long', 'text_with_summary'] as const;

export interface TextDefaultFormatter {
  readonly id: 'text_default';
  readonly label: string;
  readonly fieldTypes: readonly string[];
  /** Render each item to processed markup. Mirrors viewElements(). */
  viewElements(pipeline: FilterPipeline, items: TextItemValue[], langcode: string): string[];
}

/** Plugin implementation of the 'text_default' formatter. */
export const textDefaultFormatter: TextDefaultFormatter = {
  id: 'text_default',
  label: 'Default',
  fieldTypes: TEXT_FIELD_TYPES,
  viewElements: (pipeline, items, langcode) =>
    items.map((item) => pipeline.process(item.value ?? '', item.format, langcode).processedText),
};

export interface TrimmedFormatterSettings {
  trim_length: number;
}

export interface TextTrimmedFormatter {
  readonly id: 'text_trimmed' | 'text_summary_or_trimmed';
  readonly label: string;
  readonly fieldTypes: readonly string[];
  defaultSettings(): TrimmedFormatterSettings;
  viewElements(pipeline: FilterPipeline, items: TextItemValue[], langcode: string): string[];
}

/**
 * Plugin implementation of the 'text_trimmed' formatter, which also backs
 * 'text_summary_or_trimmed'. For the latter, an explicit summary (when present)
 * is rendered verbatim; otherwise the processed value is trimmed.
 */
export function createTextTrimmedFormatter(
  id: 'text_trimmed' | 'text_summary_or_trimmed',
  settings: Partial<TrimmedFormatterSettings> = {},
): TextTrimmedFormatter {
  const trimLength = settings.trim_length ?? 600;

  return {
    id,
    label: id === 'text_summary_or_trimmed' ? 'Summary or trimmed' : 'Trimmed',
    fieldTypes: TEXT_FIELD_TYPES,
    defaultSettings: () => ({ trim_length: 600 }),
    viewElements: (pipeline, items, langcode) => {
      const summarizer = createTextSummary(pipeline);
      return items.map((item) => {
        const useExplicitSummary =
          id === 'text_summary_or_trimmed' &&
          item.summary !== undefined &&
          item.summary !== null &&
          item.summary !== '';

        if (useExplicitSummary) {
          return pipeline.process(item.summary as string, item.format, langcode).processedText;
        }

        const processed = pipeline.process(item.value ?? '', item.format, langcode).processedText;
        return summarizer.generate(processed, item.format, trimLength);
      });
    },
  };
}
