/**
 * The render service.
 *
 * Port of the core of Drupal\Core\Render\Renderer for the scoped feature set:
 * #markup / #plain_text / #children / #prefix / #suffix / #theme handling,
 * #access gating, double-render prevention (#printed), bubbleable-metadata
 * collection via a RenderContext, and the render-cache get/set seam.
 *
 * Out of scope (separate packages): theme/Twig rendering itself (delegated to a
 * ThemeManagerInterface collaborator), #lazy_builder/#pre_render/#post_render
 * callbacks, auto-placeholdering, and asset/attachment processing.
 */

import { Markup, isMarkup, type MarkupInterface } from './markup.js';
import { Cache, CACHE_PERMANENT } from './cache.js';
import { BubbleableMetadata } from './bubbleable-metadata.js';
import { RenderContext } from './render-context.js';
import { Element } from './element.js';
import { htmlEscape, filterAdmin, filter as xssFilter } from './xss.js';
import { NullThemeManager, type ThemeManagerInterface } from './theme-manager.js';
import { NullRenderCache, type RenderCacheInterface } from './render-cache.js';
import type { RenderArray } from './render-array.js';

export class Renderer {
  /** The active render context for the current renderRoot/isolation scope. */
  private context: RenderContext | null = null;
  private isRenderingRoot = false;

  constructor(
    private readonly theme: ThemeManagerInterface = new NullThemeManager(),
    private readonly renderCache: RenderCacheInterface = new NullRenderCache(),
  ) {}

  /**
   * Renders a render array as the root of a render tree, in its own context,
   * and returns the final markup. Placeholders (when implemented) are processed
   * only at the root.
   */
  renderRoot(elements: RenderArray): string | MarkupInterface {
    if (isEmpty(elements)) {
      return '';
    }
    if (this.isRenderingRoot) {
      this.isRenderingRoot = false;
      throw new Error(
        'A stray renderRoot() invocation is causing bubbling of attached assets to break.',
      );
    }
    this.isRenderingRoot = true;
    try {
      const output = this.renderInIsolation(elements);
      if (String(output) === '') {
        return '';
      }
      return elements['#markup'] ?? '';
    } finally {
      this.isRenderingRoot = false;
    }
  }

  /**
   * Renders in a brand-new, isolated render context. Bubbleable metadata
   * collected here does not leak into any surrounding context. Returns the
   * markup wrapped as safe.
   */
  renderInIsolation(elements: RenderArray): string | MarkupInterface {
    const context = new RenderContext();
    const markup = this.executeInRenderContext(context, () =>
      this.doRender(elements, context),
    );
    return Markup.create(markup);
  }

  /**
   * Renders a render array within the current context. Must be called inside a
   * renderRoot()/renderInIsolation()/executeInRenderContext() scope.
   */
  render(elements: RenderArray, _isRootCall = false): string | MarkupInterface {
    if (this.context === null) {
      throw new Error(
        'Render context is empty, because render() was called outside of a renderRoot() or renderInIsolation() call. ' +
          'Use renderInIsolation()/renderRoot() instead.',
      );
    }
    return this.doRender(elements, this.context);
  }

  /** The internal recursive render routine. */
  private doRender(elements: RenderArray, context: RenderContext): string | MarkupInterface {
    if (isEmpty(elements)) {
      return '';
    }

    // Access gating. Full AccessResultInterface handling is out of scope; a
    // boolean false means "no access".
    if (elements['#access'] === false) {
      return '';
    }

    // Do not print elements twice.
    if (elements['#printed']) {
      return '';
    }

    if (this.context === null) {
      throw new Error(
        'Render context is empty, because render() was called outside of a renderRoot() or renderInIsolation() call.',
      );
    }

    context.push(new BubbleableMetadata());

    // Render-cache lookup for cacheable subtrees (#cache.keys present).
    if (elements['#cache']?.keys) {
      const cached = this.renderCache.get(elements);
      if (cached !== false) {
        // Replace with cached element; mark markup safe if it is a string.
        Object.keys(elements).forEach((k) => delete elements[k]);
        Object.assign(elements, cached);
        if (typeof elements['#markup'] === 'string') {
          elements['#markup'] = Markup.create(elements['#markup']);
        }
        context.update(elements);
        context.bubble();
        return elements['#markup'] ?? '';
      }
    }

    // Track pre-bubbling cache keys for the two-tier cache set() below.
    const preBubblingElements: RenderArray = {};
    if (elements['#cache']) {
      preBubblingElements['#cache'] = { ...elements['#cache'] };
    }

    // #markup / #plain_text are sanitized into safe #markup.
    if (elements['#markup'] !== undefined || elements['#plain_text'] !== undefined) {
      this.ensureMarkupIsSafe(elements);
    }

    // Defaults for bubbleable rendering metadata.
    elements['#cache'] = elements['#cache'] ?? {};
    elements['#cache'].tags = elements['#cache'].tags ?? [];
    elements['#cache']['max-age'] = elements['#cache']['max-age'] ?? CACHE_PERMANENT;
    elements['#attached'] = elements['#attached'] ?? {};

    // Children, sorted by weight.
    const children = Element.children(elements, true);

    // Initialize #children unless preset.
    if (elements['#children'] === undefined) {
      elements['#children'] = '';
    }

    // #theme delegation.
    let themeIsImplemented = elements['#theme'] !== undefined;
    if (themeIsImplemented && elements['#render_children'] === undefined) {
      const themed = this.theme.render(elements['#theme'] as string, elements);
      if (themed === false) {
        // Hook not implemented (e.g. theme suggestion miss).
        themeIsImplemented = false;
      } else {
        elements['#children'] = themed;
      }
    }

    // Render children when no theme handled them.
    if (
      (!themeIsImplemented || elements['#render_children'] !== undefined) &&
      isEmptyString(elements['#children'])
    ) {
      let childMarkup = '';
      for (const key of children) {
        childMarkup += String(this.doRender(elements[key] as RenderArray, context));
      }
      elements['#children'] = Markup.create(childMarkup);
    }

    // If #theme is not implemented and there is raw #markup, prepend it to
    // #children.
    if (!themeIsImplemented && elements['#markup'] !== undefined) {
      elements['#children'] = Markup.create(
        String(elements['#markup']) + String(elements['#children']),
      );
    }

    // Wrap with #prefix / #suffix (XSS-filtered) into the final #markup.
    if (elements['#render_children'] !== undefined) {
      elements['#markup'] = Markup.create(elements['#children']);
    } else {
      const prefix =
        elements['#prefix'] !== undefined ? this.xssFilterAdminIfUnsafe(elements['#prefix']) : '';
      const suffix =
        elements['#suffix'] !== undefined ? this.xssFilterAdminIfUnsafe(elements['#suffix']) : '';
      elements['#markup'] = Markup.create(
        String(prefix) + String(elements['#children']) + String(suffix),
      );
    }

    // Fold this element's metadata into the current frame and write back.
    context.update(elements);

    // Two-tier render cache set: only when keys are present pre- and post-bubble.
    if (preBubblingElements['#cache']?.keys && elements['#cache']?.keys) {
      if (
        JSON.stringify(preBubblingElements['#cache'].keys) !==
        JSON.stringify(elements['#cache'].keys)
      ) {
        throw new Error(
          'Cache keys may not be changed after initial setup. Use the contexts property instead to bubble additional metadata.',
        );
      }
      this.renderCache.set(elements, preBubblingElements);
      // The cache implementation may have rewritten the element; refresh frame.
      context.pop();
      context.push(new BubbleableMetadata());
      context.update(elements);
    }

    context.bubble();

    elements['#printed'] = true;
    return elements['#markup'];
  }

  /** Runs `callable` with `context` installed as the active render context. */
  executeInRenderContext<T>(context: RenderContext, callable: () => T): T {
    const previous = this.context;
    this.context = context;
    try {
      return callable();
    } finally {
      this.context = previous;
    }
  }

  /** Whether a render context is currently active. */
  hasRenderContext(): boolean {
    return this.context !== null;
  }

  /** Merges the bubbleable metadata of two render arrays into a new one. */
  mergeBubbleableMetadata(a: RenderArray, b: RenderArray): RenderArray {
    const meta = BubbleableMetadata.createFromRenderArray(a).merge(
      BubbleableMetadata.createFromRenderArray(b),
    );
    const result: RenderArray = { ...a };
    meta.applyTo(result);
    return result;
  }

  /** Escapes #plain_text or XSS-filters #markup into a safe Markup object. */
  private ensureMarkupIsSafe(elements: RenderArray): void {
    if (elements['#plain_text'] !== undefined) {
      elements['#markup'] = Markup.create(htmlEscape(String(elements['#plain_text'])));
      return;
    }
    const markup = elements['#markup'];
    if (!isMarkup(markup)) {
      const tags = elements['#allowed_tags'];
      elements['#markup'] = Markup.create(xssFilter(String(markup), tags ?? undefined));
    }
  }

  /** XSS-filters a value with the admin tag list unless it is already Markup. */
  private xssFilterAdminIfUnsafe(value: string | MarkupInterface): string | MarkupInterface {
    if (!isMarkup(value)) {
      return Markup.create(filterAdmin(String(value)));
    }
    return Markup.create(value);
  }
}

/** Drupal treats `[]`/empty as no render array. */
function isEmpty(elements: RenderArray | null | undefined): boolean {
  return !elements || Object.keys(elements).length === 0;
}

function isEmptyString(value: unknown): boolean {
  return value === undefined || value === null || String(value) === '';
}
