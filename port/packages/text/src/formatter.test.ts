import { describe, expect, it, vi } from 'vitest';
import { textDefaultFormatter, createTextTrimmedFormatter } from './formatter.js';
import type { FilterPipeline } from './contracts.js';

const mockPipeline = (processed: Record<string, string>): FilterPipeline => ({
  process: vi.fn((text: string) => ({
    processedText: processed[text] ?? `<p>${text}</p>`,
    cacheTags: [],
    cacheContexts: [],
    cacheMaxAge: -1,
  })),
  getFormat: vi.fn(() => ({ id: 'full_html', filters: () => [{ id: 'filter_html', status: true }] })),
  getFallbackFormatId: vi.fn(() => 'basic_html'),
});

describe('text_default formatter', () => {
  it('is registered for all three text field types', () => {
    expect(textDefaultFormatter.id).toBe('text_default');
    expect(textDefaultFormatter.fieldTypes).toEqual(['text', 'text_long', 'text_with_summary']);
  });

  it('renders each item through the filter pipeline', () => {
    const pipeline = mockPipeline({ hello: '<b>hello</b>' });
    const out = textDefaultFormatter.viewElements(
      pipeline,
      [{ value: 'hello', format: 'full_html' }],
      'en',
    );
    expect(out).toEqual(['<b>hello</b>']);
    expect(pipeline.process).toHaveBeenCalledWith('hello', 'full_html', 'en');
  });
});

describe('text_trimmed formatter', () => {
  it('defaults trim_length to 600', () => {
    const fmt = createTextTrimmedFormatter('text_trimmed');
    expect(fmt.defaultSettings()).toEqual({ trim_length: 600 });
    expect(fmt.id).toBe('text_trimmed');
  });

  it('trims the processed value to the configured length', () => {
    const long = 'Sentence one. ' + 'z'.repeat(700);
    const pipeline = mockPipeline({ [long]: long });
    const fmt = createTextTrimmedFormatter('text_trimmed', { trim_length: 30 });
    const out = fmt.viewElements(pipeline, [{ value: long, format: 'full_html' }], 'en');
    expect(out[0]).toBe('Sentence one.');
  });

  it('text_summary_or_trimmed uses an explicit summary when present', () => {
    const pipeline = mockPipeline({ 'My summary': '<p>My summary</p>' });
    const fmt = createTextTrimmedFormatter('text_summary_or_trimmed', { trim_length: 30 });
    const out = fmt.viewElements(
      pipeline,
      [{ value: 'long body text', format: 'full_html', summary: 'My summary' }],
      'en',
    );
    expect(out[0]).toBe('<p>My summary</p>');
    expect(pipeline.process).toHaveBeenCalledWith('My summary', 'full_html', 'en');
  });
});
