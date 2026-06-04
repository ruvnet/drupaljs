/**
 * Provides HTML string helpers: escaping, CSS identifier/ID cleaning, and a
 * pluggable filtering seam.
 *
 * Ported from Drupal\Component\Utility\Html. DOM-based parsing/serialization
 * (load/serialize/normalize/transformRootRelativeUrlsToAbsolute) is out of
 * scope for this package and is intentionally omitted. Full XSS/HTML filtering
 * is delegated through {@link HtmlFilter}.
 *
 * TODO(#38): Replace the TS fallback filter with the Rust→WASM `xss-html`
 * crate (ADR-0015). Inject it via {@link Html.setFilter} once the crate's
 * typed wrapper is available.
 */

/**
 * Contract for an HTML filtering backend.
 *
 * Implementations sanitize an untrusted HTML string, stripping disallowed
 * tags/attributes/protocols. The canonical implementation will be the
 * `xss-html` WASM crate; a minimal TS fallback ships here for bootstrapping.
 */
export interface HtmlFilter {
  /**
   * Sanitizes an HTML fragment.
   *
   * @param html The untrusted HTML.
   * @param allowedTags Optional whitelist of tag names. Implementations may
   *   ignore this if they enforce a fixed policy.
   */
  filter(html: string, allowedTags?: string[]): string;
}

/**
 * Minimal, conservative TS fallback HTML filter.
 *
 * This is NOT a complete XSS filter. It removes <script>/<style> blocks, strips
 * event handler (on*) attributes, neutralizes javascript: URIs, and drops any
 * tag not present in the allow-list. It exists only so Html.filter() is usable
 * before the WASM crate lands.
 *
 * TODO(#38): Remove in favor of the `xss-html` Rust/WASM automaton.
 */
export class FallbackHtmlFilter implements HtmlFilter {
  private static readonly DEFAULT_ALLOWED = [
    'a',
    'em',
    'strong',
    'cite',
    'blockquote',
    'code',
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    'b',
    'i',
    'p',
    'br',
    'span',
  ];

  filter(html: string, allowedTags?: string[]): string {
    const allowed = new Set(
      (allowedTags ?? FallbackHtmlFilter.DEFAULT_ALLOWED).map((t) => t.toLowerCase()),
    );

    // Remove entire <script>/<style> elements including content.
    let out = html.replace(
      /<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      '',
    );

    // Process remaining tags.
    out = out.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (
      _match,
      closing: string,
      tagName: string,
      attrs: string,
    ) => {
      const name = tagName.toLowerCase();
      if (!allowed.has(name)) {
        return '';
      }
      if (closing) {
        return `</${name}>`;
      }
      // Strip on* event handlers and javascript: protocols from attributes.
      const safeAttrs = attrs
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src|action|formaction|cite|data)\s*=\s*("|')?\s*javascript:[^"'\s>]*/gi, '');
      return `<${name}${safeAttrs}>`;
    });

    return out;
  }
}

// Named character references decoded by decodeEntities, in addition to the
// numeric forms handled generically.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  copy: '©',
  reg: '®',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

let activeFilter: HtmlFilter = new FallbackHtmlFilter();
let isAjax = false;
let classCache = new Map<string, string>();
let seenIds: Map<string, number> | null = null;

export const Html = {
  /**
   * Escapes text by converting HTML special characters to entities.
   *
   * Mirrors htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'):
   * & " ' < > are converted; single quotes become &#039;.
   */
  escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /**
   * Decodes HTML entities (named and numeric) to their UTF-8 characters.
   *
   * Decodes once: "&amp;lt;" becomes "&lt;", not "<".
   */
  decodeEntities(text: string): string {
    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
      if (body[0] === '#') {
        const isHex = body[1] === 'x' || body[1] === 'X';
        const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
        if (Number.isNaN(code)) {
          return match;
        }
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      const named = NAMED_ENTITIES[body.toLowerCase()];
      return named ?? match;
    });
  },

  /**
   * Prepares a string for use as a valid CSS identifier.
   *
   * @param identifier The identifier to clean.
   * @param filter Replacement map applied before stripping invalid chars.
   */
  cleanCssIdentifier(
    identifier: string,
    filter: Record<string, string> = {
      ' ': '-',
      _: '-',
      '/': '-',
      '[': '-',
      ']': '',
    },
  ): string {
    let result = identifier;

    // Preserve '__' across the single-underscore replacement, unless the caller
    // explicitly maps '__'.
    const protectDoubleUnderscore = !Object.prototype.hasOwnProperty.call(filter, '__');
    let hadDoubleUnderscore = false;
    if (protectDoubleUnderscore && result.includes('__')) {
      hadDoubleUnderscore = true;
      result = result.split('__').join('##');
    }

    for (const [search, replace] of Object.entries(filter)) {
      result = result.split(search).join(replace);
    }

    if (hadDoubleUnderscore) {
      result = result.split('##').join('__');
    }

    // Strip characters outside the valid CSS identifier ranges:
    // hyphen, 0-9, A-Z, underscore, a-z, and U+00A1 and higher.
    result = result.replace(
      /[^-0-9A-Z_a-z¡-￿]/gu,
      '',
    );

    // Identifiers cannot start with a digit; two leading hyphens or a hyphen +
    // digit get prefixed.
    result = result.replace(/^[0-9]/, '_');
    result = result.replace(/^(-[0-9])|^(--)/, '__');

    return result;
  },

  /**
   * Prepares a string for use as a valid CSS class name (cached, lowercased).
   */
  getClass(value: string): string {
    const key = String(value);
    const cached = classCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const cleaned = Html.cleanCssIdentifier(key.toLowerCase());
    classCache.set(key, cleaned);
    return cleaned;
  },

  /**
   * Prepares a string for use as a valid HTML ID (no uniqueness guarantee).
   */
  getId(id: string): string {
    let result = id.toLowerCase();
    // Replace spaces/underscores/brackets per Drupal's mapping.
    result = result
      .replace(/ /g, '-')
      .replace(/_/g, '-')
      .replace(/\[/g, '-')
      .replace(/\]/g, '');
    // Keep only letters, digits, hyphen, underscore.
    result = result.replace(/[^A-Za-z0-9\-_]/g, '');
    // Collapse consecutive hyphens.
    result = result.replace(/-+/g, '-');
    return result;
  },

  /**
   * Prepares a string for use as a valid HTML ID, guaranteeing uniqueness
   * across calls within the current request.
   */
  getUniqueId(id: string): string {
    if (isAjax) {
      return `${Html.getId(id)}--${Html.randomToken()}`;
    }
    if (seenIds === null) {
      seenIds = new Map<string, number>();
    }
    const base = Html.getId(id);
    const count = seenIds.get(base);
    if (count !== undefined) {
      const next = count + 1;
      seenIds.set(base, next);
      return `${base}--${next}`;
    }
    seenIds.set(base, 1);
    return base;
  },

  /**
   * Resets the seen-ID registry (call between simulated requests/tests).
   */
  resetSeenIds(): void {
    seenIds = null;
  },

  /**
   * Sets whether the current request is an AJAX request.
   */
  setIsAjax(value: boolean): void {
    isAjax = value;
  },

  /**
   * Filters untrusted HTML through the active {@link HtmlFilter} backend.
   *
   * @param html The untrusted HTML.
   * @param allowedTags Optional tag whitelist passed to the filter.
   */
  filter(html: string, allowedTags?: string[]): string {
    return activeFilter.filter(html, allowedTags);
  },

  /**
   * Replaces the active HTML filter backend.
   *
   * TODO(#38): Inject the `xss-html` WASM filter here once available.
   */
  setFilter(filter: HtmlFilter): void {
    activeFilter = filter;
  },

  /**
   * Returns the currently active HTML filter backend.
   */
  getFilter(): HtmlFilter {
    return activeFilter;
  },

  /**
   * Generates a short random base64url token used for AJAX-unique IDs.
   * @internal
   */
  randomToken(): string {
    let token = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    for (let i = 0; i < 11; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  },
} as const;
