import { describe, it, expect, vi } from 'vitest';
import type { PluginDefinition } from '@drupaljs/plugin';
import type { HtmlFilter } from '@drupaljs/util';
import { FilterHtml } from './filter-html.js';
import { FilterType } from './types.js';

const def: PluginDefinition = {
  id: 'filter_html',
  provider: 'filter',
  title: 'Limit allowed HTML tags and correct faulty HTML',
  description: 'Restrict to allowed tags.',
  type: FilterType.HTML_RESTRICTOR,
  weight: -10,
  settings: { allowed_html: '<a href> <em> <strong> <p>' },
};

function make(
  config: Record<string, unknown> = {},
  htmlFilter?: HtmlFilter,
): FilterHtml {
  return new FilterHtml(config, 'filter_html', def, htmlFilter);
}

describe('FilterHtml', () => {
  it('is an HTML_RESTRICTOR', () => {
    expect(make().getType()).toBe(FilterType.HTML_RESTRICTOR);
  });

  it('delegates sanitization to the injected HtmlFilter seam (xss-html crate)', () => {
    const seam: HtmlFilter = { filter: vi.fn().mockReturnValue('<p>clean</p>') };
    const f = make({ settings: { allowed_html: '<p> <a href>' } }, seam);
    const out = f.process('<script>x</script><p>clean</p>', 'en').getProcessedText();
    expect(out).toBe('<p>clean</p>');
    // The configured allow-list is parsed and passed to the seam.
    expect(seam.filter).toHaveBeenCalledWith(
      '<script>x</script><p>clean</p>',
      expect.arrayContaining(['p', 'a']),
    );
  });

  it('parses the allowed_html setting into a getHtmlRestrictions() map', () => {
    const f = make({ settings: { allowed_html: '<a href hreflang> <em> <p>' } });
    const r = f.getHtmlRestrictions();
    expect(r).not.toBe(false);
    if (r === false) return;
    expect(Object.keys(r.allowed).sort()).toEqual(['a', 'em', 'p']);
    // <a href hreflang> => href and hreflang allowed, others not.
    expect(r.allowed.a).toEqual({ href: true, hreflang: true });
    // <em> with no attributes => no attributes allowed.
    expect(r.allowed.em).toBe(false);
  });

  it('a bare tag with no attribute list forbids attributes', () => {
    const f = make({ settings: { allowed_html: '<strong>' } });
    const r = f.getHtmlRestrictions();
    if (r === false) throw new Error('expected restrictions');
    expect(r.allowed.strong).toBe(false);
  });

  it('falls back to the @drupaljs/util Html seam when none injected', () => {
    const f = make({ settings: { allowed_html: '<em> <strong>' } });
    const out = f.process('<em>ok</em><script>bad()</script>', 'en').getProcessedText();
    expect(out).toContain('<em>ok</em>');
    expect(out).not.toContain('<script>');
  });
});
