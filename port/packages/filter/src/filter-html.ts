import type { PluginDefinition } from '@drupaljs/plugin';
import { Html, type HtmlFilter } from '@drupaljs/util';
import { FilterBase } from './filter-base.js';
import { FilterProcessResult } from './filter-process-result.js';
import type { HtmlRestrictions } from './types.js';

/**
 * Restricts HTML to an allow-listed set of tags and attributes.
 *
 * Port of `Drupal\filter\Plugin\Filter\FilterHtml` (a `TYPE_HTML_RESTRICTOR`).
 * The `allowed_html` setting is a space-separated list of tag specs, e.g.
 * `"<a href hreflang> <em> <strong> <p>"`. This is parsed into:
 *   - a flat tag allow-list passed to the HTML sanitization seam, and
 *   - a {@link HtmlRestrictions} map exposed via {@link getHtmlRestrictions}.
 *
 * Actual sanitization is delegated to an {@link HtmlFilter} seam. The canonical
 * backend is the Rust→WASM `xss-html` crate (ADR-0015); until its typed wrapper
 * is wired, the `@drupaljs/util` {@link Html} fallback filter is used. Inject a
 * custom seam (e.g. the WASM one) via the constructor.
 *
 * @see core/modules/filter/src/Plugin/Filter/FilterHtml.php
 * TODO(#38): replace the default seam with the `xss-html` WASM filter.
 */
export class FilterHtml extends FilterBase {
  private readonly htmlFilter: HtmlFilter;

  constructor(
    configuration: Record<string, unknown>,
    pluginId: string,
    pluginDefinition: PluginDefinition,
    htmlFilter?: HtmlFilter,
  ) {
    super(configuration, pluginId, pluginDefinition);
    // Default to the @drupaljs/util active Html filter seam (the xss-html crate
    // registers itself there once available).
    this.htmlFilter = htmlFilter ?? Html.getFilter();
  }

  /** The raw `allowed_html` setting string. */
  private allowedHtmlSetting(): string {
    return String(this.settings.allowed_html ?? '');
  }

  /** Parsed tag → attribute-list specs from the `allowed_html` setting. */
  private parseAllowedTags(): Map<string, string[]> {
    const tags = new Map<string, string[]>();
    const re = /<([a-zA-Z0-9*]+)((?:\s+[^<>\s]+)*)\s*>/g;
    let m: RegExpExecArray | null;
    const setting = this.allowedHtmlSetting();
    while ((m = re.exec(setting)) !== null) {
      const tag = m[1]!.toLowerCase();
      const attrs = m[2]!.trim();
      tags.set(tag, attrs === '' ? [] : attrs.split(/\s+/).map((a) => a.toLowerCase()));
    }
    return tags;
  }

  process(text: string, _langcode: string): FilterProcessResult {
    const allowedTags = [...this.parseAllowedTags().keys()];
    return new FilterProcessResult(this.htmlFilter.filter(text, allowedTags));
  }

  override getHtmlRestrictions(): HtmlRestrictions {
    const parsed = this.parseAllowedTags();
    const allowed: Record<string, boolean | Record<string, true>> = {};
    for (const [tag, attrs] of parsed) {
      if (attrs.length === 0) {
        // A bare tag spec forbids all attributes.
        allowed[tag] = false;
      } else {
        const attrMap: Record<string, true> = {};
        for (const attr of attrs) attrMap[attr] = true;
        allowed[tag] = attrMap;
      }
    }
    return { allowed };
  }
}
