import { describe, it, expect } from 'vitest';
import { RenderContext } from './render-context.js';
import { BubbleableMetadata } from './bubbleable-metadata.js';
import type { RenderArray } from './render-array.js';

describe('RenderContext', () => {
  it('behaves like a stack (push/pop/count)', () => {
    const ctx = new RenderContext();
    expect(ctx.count()).toBe(0);
    const frame = new BubbleableMetadata();
    ctx.push(frame);
    expect(ctx.count()).toBe(1);
    expect(ctx.top()).toBe(frame);
    expect(ctx.pop()).toBe(frame);
    expect(ctx.count()).toBe(0);
  });

  describe('update', () => {
    it('merges the element metadata into the current frame and writes it back to the element', () => {
      const ctx = new RenderContext();
      ctx.push(new BubbleableMetadata().setCacheTags(['frame:1']));
      const element: RenderArray = { '#cache': { tags: ['el:1'] } };
      ctx.update(element);
      // Frame now carries both element + frame tags.
      expect(ctx.top().getCacheTags()).toEqual(['el:1', 'frame:1']);
      // Element gets the merged cache metadata applied back.
      expect(element['#cache']?.tags).toEqual(['el:1', 'frame:1']);
    });
  });

  describe('bubble', () => {
    it('does nothing when only the root frame remains', () => {
      const ctx = new RenderContext();
      const root = new BubbleableMetadata().setCacheTags(['root']);
      ctx.push(root);
      ctx.bubble();
      expect(ctx.count()).toBe(1);
      expect(ctx.top()).toBe(root);
    });

    it('merges the current frame into its parent and collapses the stack', () => {
      const ctx = new RenderContext();
      ctx.push(new BubbleableMetadata().setCacheTags(['parent']));
      ctx.push(new BubbleableMetadata().setCacheTags(['child']));
      ctx.bubble();
      expect(ctx.count()).toBe(1);
      expect(ctx.top().getCacheTags()).toEqual(['child', 'parent']);
    });
  });
});
