/**
 * The render context: a stack of BubbleableMetadata frames.
 *
 * Port of Drupal\Core\Render\RenderContext (PHP extends SplStack). Each frame
 * holds the bubbleable metadata for a subtree; `update()` folds an element's
 * own metadata into the current frame and `bubble()` merges a frame into its
 * parent as rendering unwinds.
 */

import { BubbleableMetadata } from './bubbleable-metadata.js';
import type { RenderArray } from './render-array.js';

export class RenderContext {
  private readonly stack: BubbleableMetadata[] = [];

  count(): number {
    return this.stack.length;
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  push(frame: BubbleableMetadata): void {
    this.stack.push(frame);
  }

  pop(): BubbleableMetadata {
    const frame = this.stack.pop();
    if (frame === undefined) {
      throw new Error('Cannot pop from an empty RenderContext.');
    }
    return frame;
  }

  /** The current (top) frame without removing it. */
  top(): BubbleableMetadata {
    const frame = this.stack[this.stack.length - 1];
    if (frame === undefined) {
      throw new Error('RenderContext is empty.');
    }
    return frame;
  }

  /**
   * Updates the current frame with the just-rendered element's metadata, and
   * writes the merged metadata back onto the element (so it is consistent if it
   * gets render-cached).
   */
  update(element: RenderArray): void {
    const frame = this.pop();
    const updated = BubbleableMetadata.createFromRenderArray(element).merge(frame);
    updated.applyTo(element);
    this.push(updated);
  }

  /**
   * Bubbles the current frame into its parent. No-op at the root (a single
   * frame), since renderRoot() resets the stack itself.
   */
  bubble(): void {
    if (this.stack.length === 1) {
      return;
    }
    const current = this.pop();
    const parent = this.pop();
    this.push(current.merge(parent));
  }
}
