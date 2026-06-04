import { describe, expect, it, vi } from 'vitest';
import { createTextSummary } from './text-summary.js';
import type { FilterPipeline, FilterFormat } from './contracts.js';

const pipelineWith = (filterIds: string[]): FilterPipeline => {
  const format: FilterFormat = {
    id: 'full_html',
    filters: () => filterIds.map((id) => ({ id, status: true })),
  };
  return {
    process: vi.fn(),
    getFormat: vi.fn(() => format),
    getFallbackFormatId: vi.fn(() => 'basic_html'),
  };
};

const noFormatPipeline = (): FilterPipeline => ({
  process: vi.fn(),
  getFormat: vi.fn(() => undefined),
  getFallbackFormatId: vi.fn(() => 'basic_html'),
});

describe('TextSummary.generate', () => {
  it('returns the whole text when size is 0 and there is no delimiter', () => {
    const summary = createTextSummary(pipelineWith([]));
    expect(summary.generate('full body', null, 0)).toBe('full body');
  });

  it('chops at the <!--break--> delimiter when present', () => {
    const summary = createTextSummary(pipelineWith([]));
    expect(summary.generate('intro<!--break-->rest of body', null, 0)).toBe('intro');
  });

  it('returns the whole text when shorter than the requested size', () => {
    const summary = createTextSummary(pipelineWith([]));
    expect(summary.generate('short', null, 600)).toBe('short');
  });

  it('returns empty string when the named format does not exist', () => {
    const summary = createTextSummary(noFormatPipeline());
    const long = 'x'.repeat(1000);
    expect(summary.generate(long, 'missing', 600)).toBe('');
  });

  it('breaks at the end of a closing paragraph nearest the limit', () => {
    const summary = createTextSummary(pipelineWith([]));
    const text = '<p>First paragraph.</p><p>' + 'y'.repeat(700) + '</p>';
    const out = summary.generate(text, null, 40);
    expect(out).toBe('<p>First paragraph.</p>');
  });

  it('falls back to a sentence boundary when no paragraph tag is present', () => {
    const summary = createTextSummary(pipelineWith([]));
    const text = 'Sentence one. ' + 'z'.repeat(700);
    const out = summary.generate(text, null, 30);
    expect(out).toBe('Sentence one.');
  });

  it('treats newlines as breaks when filter_autop is enabled', () => {
    const summary = createTextSummary(pipelineWith(['filter_autop']));
    const text = 'Line one\n' + 'q'.repeat(700);
    const out = summary.generate(text, 'full_html', 30);
    expect(out).toBe('Line one');
  });
});
