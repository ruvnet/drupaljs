import { describe, expect, it, vi } from 'vitest';
import { createTextProcessed } from './processed-text.js';
import type { FilterPipeline, FilterProcessResult } from './contracts.js';

const result = (over: Partial<FilterProcessResult> = {}): FilterProcessResult => ({
  processedText: '<p>processed</p>',
  cacheTags: ['node:1'],
  cacheContexts: ['languages'],
  cacheMaxAge: 42,
  ...over,
});

const mockPipeline = (over: Partial<FilterProcessResult> = {}): FilterPipeline => ({
  process: vi.fn(() => result(over)),
  getFormat: vi.fn(),
  getFallbackFormatId: vi.fn(() => 'basic_html'),
});

describe('TextProcessed computed property', () => {
  it('throws when no text source is configured', () => {
    const pipeline = mockPipeline();
    expect(() =>
      createTextProcessed(pipeline, {
        item: { value: 'x', format: 'full_html' },
        langcode: 'en',
      } as never),
    ).toThrow(/text source/);
  });

  it('runs the configured source text through the pipeline', () => {
    const pipeline = mockPipeline();
    const prop = createTextProcessed(pipeline, {
      textSource: 'value',
      item: { value: 'hello', format: 'full_html' },
      langcode: 'en',
    });

    expect(prop.getValue()).toBe('<p>processed</p>');
    expect(pipeline.process).toHaveBeenCalledWith('hello', 'full_html', 'en');
  });

  it('reads from the summary source for summary_processed', () => {
    const pipeline = mockPipeline();
    const prop = createTextProcessed(pipeline, {
      textSource: 'summary',
      item: { value: 'body', summary: 'sum', format: 'full_html' },
      langcode: 'en',
    });

    prop.getValue();
    expect(pipeline.process).toHaveBeenCalledWith('sum', 'full_html', 'en');
  });

  it('short-circuits empty text without invoking the pipeline', () => {
    const pipeline = mockPipeline();
    const prop = createTextProcessed(pipeline, {
      textSource: 'value',
      item: { value: '', format: 'full_html' },
      langcode: 'en',
    });

    expect(prop.getValue()).toBe('');
    expect(pipeline.process).not.toHaveBeenCalled();
  });

  it('caches the processed result (pipeline invoked once)', () => {
    const pipeline = mockPipeline();
    const prop = createTextProcessed(pipeline, {
      textSource: 'value',
      item: { value: 'hello', format: 'full_html' },
      langcode: 'en',
    });

    prop.getValue();
    prop.getValue();
    expect(pipeline.process).toHaveBeenCalledTimes(1);
  });

  it('bubbles cacheability metadata from the filter result', () => {
    const pipeline = mockPipeline({ cacheTags: ['node:5'], cacheContexts: ['user'], cacheMaxAge: 7 });
    const prop = createTextProcessed(pipeline, {
      textSource: 'value',
      item: { value: 'hello', format: 'full_html' },
      langcode: 'en',
    });

    expect(prop.getCacheTags()).toEqual(['node:5']);
    expect(prop.getCacheContexts()).toEqual(['user']);
    expect(prop.getCacheMaxAge()).toBe(7);
  });

  it('invalidates the cache when setValue is called', () => {
    const pipeline = mockPipeline();
    const prop = createTextProcessed(pipeline, {
      textSource: 'value',
      item: { value: 'hello', format: 'full_html' },
      langcode: 'en',
    });

    prop.getValue();
    prop.setValue(null);
    prop.getValue();
    expect(pipeline.process).toHaveBeenCalledTimes(2);
  });
});
