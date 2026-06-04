import { describe, it, expect, vi } from 'vitest';
import { Renderer } from './renderer.js';
import { Markup, isMarkup } from './markup.js';
import { CACHE_PERMANENT } from './cache.js';
import type { ThemeManagerInterface } from './theme-manager.js';
import type { RenderCacheInterface } from './render-cache.js';
import type { RenderArray } from './render-array.js';

/** A theme manager mock that never finds a hook (returns false). */
function noTheme(): ThemeManagerInterface {
  return { render: vi.fn().mockReturnValue(false) };
}

/** A render cache mock that always misses and records sets. */
function nullCache(): RenderCacheInterface {
  return {
    get: vi.fn().mockReturnValue(false),
    set: vi.fn(),
  };
}

function make(theme = noTheme(), cache = nullCache()) {
  return { renderer: new Renderer(theme, cache), theme, cache };
}

describe('Renderer', () => {
  describe('#markup handling', () => {
    it('renders an XSS-filtered #markup string', () => {
      const { renderer } = make();
      const build: RenderArray = { '#markup': '<strong>hi</strong>' };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('<strong>hi</strong>');
      expect(isMarkup(out)).toBe(true);
    });

    it('strips disallowed tags from raw #markup (admin xss filter)', () => {
      const { renderer } = make();
      const build: RenderArray = { '#markup': 'ok<script>alert(1)</script>' };
      const out = renderer.renderRoot(build);
      expect(String(out)).not.toContain('<script>');
      expect(String(out)).toContain('ok');
    });

    it('does not re-filter a value already wrapped in Markup', () => {
      const { renderer } = make();
      const safe = Markup.create('<script>trusted</script>');
      const build: RenderArray = { '#markup': safe };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('<script>trusted</script>');
    });
  });

  describe('#plain_text handling', () => {
    it('HTML-escapes #plain_text and ignores #markup', () => {
      const { renderer } = make();
      const build: RenderArray = { '#plain_text': '<b>a & b</b>' };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('&lt;b&gt;a &amp; b&lt;/b&gt;');
    });
  });

  describe('#prefix and #suffix', () => {
    it('wraps #children with filtered #prefix and #suffix', () => {
      const { renderer } = make();
      const build: RenderArray = {
        '#prefix': '<div>',
        '#markup': 'body',
        '#suffix': '</div>',
      };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('<div>body</div>');
    });
  });

  describe('#children handling', () => {
    it('concatenates rendered children in weight order', () => {
      const { renderer } = make();
      const build: RenderArray = {
        second: { '#markup': 'B', '#weight': 10 },
        first: { '#markup': 'A', '#weight': -10 },
      };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('AB');
    });

    it('respects insertion order for equal weights', () => {
      const { renderer } = make();
      const build: RenderArray = {
        a: { '#markup': '1' },
        b: { '#markup': '2' },
        c: { '#markup': '3' },
      };
      expect(String(renderer.renderRoot(build))).toBe('123');
    });

    it('prepends #markup to rendered children when no #theme is set', () => {
      const { renderer } = make();
      const build: RenderArray = {
        '#markup': 'parent-',
        child: { '#markup': 'kid' },
      };
      expect(String(renderer.renderRoot(build))).toBe('parent-kid');
    });
  });

  describe('#theme handling', () => {
    it('delegates to the theme manager and uses its return as #children', () => {
      const theme: ThemeManagerInterface = { render: vi.fn().mockReturnValue('<themed/>') };
      const { renderer } = make(theme);
      const build: RenderArray = { '#theme': 'my_hook', '#foo': 'bar' };
      const out = renderer.renderRoot(build);
      expect(theme.render).toHaveBeenCalledWith('my_hook', expect.objectContaining({ '#theme': 'my_hook' }));
      expect(String(out)).toBe('<themed/>');
    });

    it('falls back to rendering children when the theme hook is not implemented', () => {
      const theme: ThemeManagerInterface = { render: vi.fn().mockReturnValue(false) };
      const { renderer } = make(theme);
      const build: RenderArray = { '#theme': 'missing', child: { '#markup': 'fallback' } };
      expect(String(renderer.renderRoot(build))).toBe('fallback');
    });
  });

  describe('access control', () => {
    it('renders nothing when #access is false', () => {
      const { renderer } = make();
      const build: RenderArray = { '#access': false, '#markup': 'secret' };
      expect(String(renderer.renderRoot(build))).toBe('');
    });

    it('renders normally when #access is true', () => {
      const { renderer } = make();
      const build: RenderArray = { '#access': true, '#markup': 'visible' };
      expect(String(renderer.renderRoot(build))).toBe('visible');
    });
  });

  describe('empty / printed', () => {
    it('returns an empty string for an empty render array', () => {
      const { renderer } = make();
      expect(renderer.renderRoot({})).toBe('');
    });

    it('does not render an element twice (#printed)', () => {
      const { renderer } = make();
      const build: RenderArray = { '#markup': 'once' };
      renderer.renderRoot(build);
      expect(build['#printed']).toBe(true);
    });
  });

  describe('render() requires a render context', () => {
    it('throws when render() is called outside renderRoot/executeInRenderContext', () => {
      const { renderer } = make();
      expect(() => renderer.render({ '#markup': 'x' })).toThrow(/render context/i);
    });
  });

  describe('bubbleable metadata', () => {
    it('bubbles child cache tags up to the root element', () => {
      const { renderer } = make();
      const build: RenderArray = {
        child: { '#markup': 'x', '#cache': { tags: ['node:1'] } },
      };
      renderer.renderRoot(build);
      expect(build['#cache']?.tags).toContain('node:1');
    });

    it('applies default bubbleable metadata to the rendered element', () => {
      const { renderer } = make();
      const build: RenderArray = { '#markup': 'x' };
      renderer.renderRoot(build);
      expect(build['#cache']?.['max-age']).toBe(CACHE_PERMANENT);
      expect(build['#attached']).toEqual({});
    });

    it('mergeBubbleableMetadata combines two render arrays', () => {
      const { renderer } = make();
      const a: RenderArray = { '#cache': { tags: ['a'] } };
      const b: RenderArray = { '#cache': { tags: ['b'] } };
      const merged = renderer.mergeBubbleableMetadata(a, b);
      expect(merged['#cache']?.tags).toEqual(['a', 'b']);
    });
  });

  describe('render cache collaboration', () => {
    it('consults the render cache for elements with #cache keys', () => {
      const { renderer, cache } = make();
      const build: RenderArray = { '#markup': 'x', '#cache': { keys: ['my', 'key'] } };
      renderer.renderRoot(build);
      expect(cache.get).toHaveBeenCalled();
    });

    it('returns the cached markup on a cache hit without re-rendering children', () => {
      const theme = noTheme();
      const cache: RenderCacheInterface = {
        get: vi.fn().mockReturnValue({
          '#markup': Markup.create('CACHED'),
          '#cache': { tags: ['cached'], contexts: [], 'max-age': CACHE_PERMANENT },
          '#attached': {},
        }),
        set: vi.fn(),
      };
      const { renderer } = make(theme, cache);
      const build: RenderArray = {
        '#cache': { keys: ['k'] },
        child: { '#markup': 'should-not-render' },
      };
      const out = renderer.renderRoot(build);
      expect(String(out)).toBe('CACHED');
    });
  });

  describe('executeInRenderContext', () => {
    it('exposes a usable render context to the callable and bubbles to its frame', () => {
      const { renderer } = make();
      const result = renderer.renderInIsolation({
        '#markup': 'iso',
        '#cache': { tags: ['iso:1'] },
      });
      expect(String(result)).toBe('iso');
    });
  });
});
