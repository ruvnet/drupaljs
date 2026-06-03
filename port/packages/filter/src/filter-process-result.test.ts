import { describe, it, expect } from 'vitest';
import { FilterProcessResult } from './filter-process-result.js';

describe('FilterProcessResult', () => {
  it('defaults to empty processed text', () => {
    expect(new FilterProcessResult().getProcessedText()).toBe('');
  });

  it('carries the processed text and stringifies to it', () => {
    const r = new FilterProcessResult('<p>hi</p>');
    expect(r.getProcessedText()).toBe('<p>hi</p>');
    expect(String(r)).toBe('<p>hi</p>');
    expect(`${r}`).toBe('<p>hi</p>');
  });

  it('setProcessedText is chainable and mutates the value', () => {
    const r = new FilterProcessResult('a');
    const ret = r.setProcessedText('b');
    expect(ret).toBe(r);
    expect(r.getProcessedText()).toBe('b');
  });

  it('collects cache tags, contexts and merges max-age (min wins)', () => {
    const r = new FilterProcessResult('x');
    r.addCacheTags(['node:1', 'node:2']).addCacheContexts(['languages']);
    r.setCacheMaxAge(300);
    expect(r.getCacheTags().sort()).toEqual(['node:1', 'node:2']);
    expect(r.getCacheContexts()).toEqual(['languages']);
    expect(r.getCacheMaxAge()).toBe(300);
  });

  it('deduplicates cache tags and contexts', () => {
    const r = new FilterProcessResult('x');
    r.addCacheTags(['t']).addCacheTags(['t']);
    r.addCacheContexts(['c']).addCacheContexts(['c']);
    expect(r.getCacheTags()).toEqual(['t']);
    expect(r.getCacheContexts()).toEqual(['c']);
  });

  it('merge() combines metadata from another result (lower max-age wins)', () => {
    const a = new FilterProcessResult('a');
    a.addCacheTags(['t1']).setCacheMaxAge(600);
    const b = new FilterProcessResult('b');
    b.addCacheTags(['t2']).addCacheContexts(['user']).setCacheMaxAge(120);
    const merged = a.merge(b);
    expect(merged).toBe(a);
    expect(a.getCacheTags().sort()).toEqual(['t1', 't2']);
    expect(a.getCacheContexts()).toEqual(['user']);
    expect(a.getCacheMaxAge()).toBe(120);
  });

  it('PERMANENT (-1 / Infinity) never lowers a finite max-age', () => {
    const r = new FilterProcessResult('x');
    r.setCacheMaxAge(50);
    r.setCacheMaxAge(FilterProcessResult.CACHE_MAX_AGE_PERMANENT);
    expect(r.getCacheMaxAge()).toBe(50);
  });

  it('attaches libraries', () => {
    const r = new FilterProcessResult('x');
    r.addAttachedLibrary('filter/caption').addAttachedLibrary('filter/caption');
    expect(r.getAttachedLibraries()).toEqual(['filter/caption']);
  });
});
