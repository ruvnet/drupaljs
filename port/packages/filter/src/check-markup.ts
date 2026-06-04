import type { FilterFormat } from './filter-format.js';
import { FilterProcessResult } from './filter-process-result.js';
import { FilterType, type FilterInterface } from './types.js';

/**
 * Runs a piece of text through all enabled filters of a text format.
 *
 * Port of the `processed_text` render element's pipeline
 * (`ProcessedText::preRenderText`), which is what the deprecated `check_markup()`
 * delegates to. Two passes over the format's enabled filters (weight-ordered):
 *   1. **prepare** — each filter escapes HTML-like structures;
 *   2. **process** — each filter transforms the text and contributes bubbleable
 *      cacheability metadata, which is merged into the returned result.
 *
 * Windows/Mac newlines are normalized to `\n` first. A disabled (or missing)
 * format yields an empty result. `filterTypesToSkip` lets callers skip whole
 * filter types, except {@link FilterType.HTML_RESTRICTOR}, which can never be
 * skipped (security).
 *
 * @param text The untrusted text to filter.
 * @param format The text format to apply.
 * @param langcode Language code of the text (default `''`).
 * @param filterTypesToSkip Filter types to skip (HTML_RESTRICTOR is never skipped).
 * @returns A {@link FilterProcessResult} carrying the filtered text + metadata.
 *
 * @see core/modules/filter/src/Element/ProcessedText.php
 * @see core/modules/filter/filter.module (check_markup)
 */
export function checkMarkup(
  text: string,
  format: FilterFormat,
  langcode = '',
  filterTypesToSkip: readonly FilterType[] = [],
): FilterProcessResult {
  if (!format.status()) {
    return new FilterProcessResult('');
  }

  const mustApply = (filter: FilterInterface): boolean => {
    if (!filter.status) return false;
    const type = filter.getType();
    // TYPE_HTML_RESTRICTOR can never be skipped.
    return type === FilterType.HTML_RESTRICTOR || !filterTypesToSkip.includes(type);
  };

  // Normalize all Windows/Mac newlines to a single LF.
  let current = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const filters = format.filters();

  // Pass 1: prepare (escaping).
  for (const filter of filters) {
    if (mustApply(filter)) {
      current = filter.prepare(current, langcode);
    }
  }

  // Pass 2: process, merging bubbleable metadata.
  const result = new FilterProcessResult();
  for (const filter of filters) {
    if (mustApply(filter)) {
      const step = filter.process(current, langcode);
      result.merge(step);
      current = step.getProcessedText();
    }
  }

  result.setProcessedText(current);
  return result;
}
