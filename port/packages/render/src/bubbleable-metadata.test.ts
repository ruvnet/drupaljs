import { describe, it, expect } from 'vitest';
import { BubbleableMetadata } from './bubbleable-metadata.js';
import { CACHE_PERMANENT } from './cache.js';
import type { RenderArray } from './render-array.js';

describe('BubbleableMetadata', () => {
  it('defaults to empty tags/contexts, PERMANENT max-age and empty attachments', () => {
    const m = new BubbleableMetadata();
    expect(m.getCacheTags()).toEqual([]);
    expect(m.getCacheContexts()).toEqual([]);
    expect(m.getCacheMaxAge()).toBe(CACHE_PERMANENT);
    expect(m.getAttachments()).toEqual({});
  });

  describe('merge', () => {
    it('merges cache tags and contexts from both objects', () => {
      const a = new BubbleableMetadata().setCacheTags(['node:1']).setCacheContexts(['user']);
      const b = new BubbleableMetadata().setCacheTags(['node:2']).setCacheContexts(['url']);
      const merged = a.merge(b);
      expect(merged.getCacheTags()).toEqual(['node:1', 'node:2']);
      expect(merged.getCacheContexts()).toEqual(['user', 'url']);
    });

    it('keeps the lowest max-age', () => {
      const a = new BubbleableMetadata().setCacheMaxAge(60);
      const b = new BubbleableMetadata().setCacheMaxAge(30);
      expect(a.merge(b).getCacheMaxAge()).toBe(30);
    });

    it('does not mutate the operands (returns a new object)', () => {
      const a = new BubbleableMetadata().setCacheTags(['a']);
      const b = new BubbleableMetadata().setCacheTags(['b']);
      const merged = a.merge(b);
      expect(a.getCacheTags()).toEqual(['a']);
      expect(b.getCacheTags()).toEqual(['b']);
      expect(merged).not.toBe(a);
    });

    it('merges attachments, deep-merging drupalSettings', () => {
      const a = new BubbleableMetadata().setAttachments({
        library: ['core/a'],
        drupalSettings: { foo: { x: 1 } },
      });
      const b = new BubbleableMetadata().setAttachments({
        library: ['core/b'],
        drupalSettings: { foo: { y: 2 } },
      });
      const merged = a.merge(b);
      expect(merged.getAttachments().library).toEqual(['core/a', 'core/b']);
      expect(merged.getAttachments().drupalSettings).toEqual({ foo: { x: 1, y: 2 } });
    });
  });

  describe('createFromRenderArray', () => {
    it('reads #cache and #attached off a render array', () => {
      const build: RenderArray = {
        '#cache': { tags: ['t'], contexts: ['c'], 'max-age': 10 },
        '#attached': { library: ['core/x'] },
      };
      const m = BubbleableMetadata.createFromRenderArray(build);
      expect(m.getCacheTags()).toEqual(['t']);
      expect(m.getCacheContexts()).toEqual(['c']);
      expect(m.getCacheMaxAge()).toBe(10);
      expect(m.getAttachments()).toEqual({ library: ['core/x'] });
    });

    it('applies defaults when keys are absent', () => {
      const m = BubbleableMetadata.createFromRenderArray({});
      expect(m.getCacheTags()).toEqual([]);
      expect(m.getCacheMaxAge()).toBe(CACHE_PERMANENT);
      expect(m.getAttachments()).toEqual({});
    });
  });

  describe('applyTo', () => {
    it('writes #cache and #attached back onto a render array', () => {
      const build: RenderArray = {};
      new BubbleableMetadata()
        .setCacheTags(['node:1'])
        .setCacheContexts(['user'])
        .setCacheMaxAge(5)
        .setAttachments({ library: ['core/y'] })
        .applyTo(build);
      expect(build['#cache']).toEqual({ tags: ['node:1'], contexts: ['user'], 'max-age': 5 });
      expect(build['#attached']).toEqual({ library: ['core/y'] });
    });
  });
});
