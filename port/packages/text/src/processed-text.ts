/**
 * TextProcessed: a computed property that runs a text field's value (or
 * summary) through the filter pipeline and exposes the processed markup plus
 * bubbled cacheability metadata. Ports core/modules/text/src/TextProcessed.php.
 */
import type { FilterPipeline, FilterProcessResult, TextItemValue } from './contracts.js';

export interface TextProcessedOptions {
  /** Which item property to process: `value` (default) or `summary`. */
  readonly textSource: 'value' | 'summary';
  /** The parent field item providing the source text and format. */
  readonly item: TextItemValue;
  /** Language of the item being rendered. */
  readonly langcode: string;
}

/** A lazily-computed, cache-aware processed-text property. */
export interface TextProcessed {
  /** Returns the processed (filtered) markup; computed once and cached. */
  getValue(): string;
  /** Resets the cached processed result. Passing a value pre-seeds it. */
  setValue(value: FilterProcessResult | null): void;
  getCacheTags(): string[];
  getCacheContexts(): string[];
  getCacheMaxAge(): number;
}

export function createTextProcessed(
  pipeline: FilterPipeline,
  options: TextProcessedOptions,
): TextProcessed {
  if (options.textSource === undefined || options.textSource === null) {
    throw new Error(
      "The definition's 'text source' key has to specify the name of the text property to be processed.",
    );
  }

  const { item, textSource, langcode } = options;
  let processed: FilterProcessResult | null = null;

  const compute = (): FilterProcessResult => {
    if (processed !== null) return processed;

    const text = textSource === 'summary' ? item.summary : item.value;
    if (text === undefined || text === null || text === '') {
      processed = { processedText: '', cacheTags: [], cacheContexts: [], cacheMaxAge: -1 };
    } else {
      processed = pipeline.process(text, item.format, langcode);
    }
    return processed;
  };

  return {
    getValue: () => compute().processedText,
    setValue: (value) => {
      processed = value;
    },
    getCacheTags: () => compute().cacheTags,
    getCacheContexts: () => compute().cacheContexts,
    getCacheMaxAge: () => compute().cacheMaxAge,
  };
}
