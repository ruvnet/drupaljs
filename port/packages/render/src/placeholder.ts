/**
 * Placeholder interface (stub).
 *
 * Port of Drupal\Core\Render\Placeholder\PlaceholderStrategyInterface plus a
 * minimal generator seam. Full placeholdering/BigPipe is a separate concern;
 * this provides the contract and a no-op default so the renderer can compile
 * and bubble metadata correctly without implementing lazy builders yet.
 *
 * TODO: implement auto-placeholdering + #lazy_builder when @drupaljs/big-pipe
 * (or equivalent) lands.
 */

import type { RenderArray } from './render-array.js';

/** Map of placeholder markup string -> render array describing its content. */
export type PlaceholderMap = Record<string, RenderArray>;

/** Port of PlaceholderStrategyInterface. */
export interface PlaceholderStrategyInterface {
  /**
   * Processes placeholders, returning a (possibly reduced) map whose render
   * arrays may be rewritten to use a specific strategy (ESI, BigPipe, ...).
   */
  processPlaceholders(placeholders: PlaceholderMap): PlaceholderMap;
}

/** Generates placeholders for elements that opt in via #create_placeholder. */
export interface PlaceholderGeneratorInterface {
  /** Whether a placeholder can be created for the element (needs a lazy builder). */
  canCreatePlaceholder(element: RenderArray): boolean;
  /** Whether the element should be auto-placeholdered (e.g. has high-cardinality contexts). */
  shouldAutomaticallyPlaceholder(element: RenderArray): boolean;
  /** Replaces the element with a placeholder render array. */
  createPlaceholder(element: RenderArray): RenderArray;
}

/** No-op generator: never placeholders. Sufficient until lazy builders land. */
export class NullPlaceholderGenerator implements PlaceholderGeneratorInterface {
  canCreatePlaceholder(): boolean {
    return false;
  }

  shouldAutomaticallyPlaceholder(): boolean {
    return false;
  }

  createPlaceholder(element: RenderArray): RenderArray {
    return element;
  }
}

/** No-op strategy: returns placeholders unchanged. */
export class NullPlaceholderStrategy implements PlaceholderStrategyInterface {
  processPlaceholders(placeholders: PlaceholderMap): PlaceholderMap {
    return placeholders;
  }
}
