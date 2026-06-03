/**
 * HTML escaping and a minimal XSS filter.
 *
 * Port of the small surface of Drupal\Component\Utility\Html::escape() and
 * Xss::filter()/filterAdmin() that the renderer depends on.
 *
 * NOTE: Drupal's full Xss filter is a stateful HTML automaton — per ADR-0015
 * that belongs in a Rust/WASM crate. This is a deliberately conservative TS
 * stub: it escapes everything and then restores only the tags on the allow
 * list. It is sufficient for the render-pipeline tests and is the seam a real
 * filter will replace.
 *
 * TODO: replace `filter`/`filterAdmin` with the @drupaljs/utility (or WASM) Xss
 * implementation. The admin tag list below tracks Xss::getAdminTagList().
 */

/** Drupal's admin tag allow-list (Xss::getAdminTagList()). */
export const ADMIN_TAG_LIST: readonly string[] = [
  'a', 'abbr', 'acronym', 'address', 'article', 'aside', 'b', 'bdi', 'bdo',
  'big', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup',
  'command', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption',
  'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup',
  'hr', 'i', 'img', 'ins', 'kbd', 'mark', 'menu', 'meter', 'nav', 'ol', 'output',
  'p', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'small',
  'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'time', 'tr', 'tt', 'u', 'ul', 'var', 'wbr',
];

/** HTML-escapes a string (Html::escape): & < > " '. */
export function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Filters a string, allowing only the given tags. Disallowed tags are removed.
 *
 * Conservative stub: strips any tag (and its angle brackets) whose name is not
 * on the allow-list, leaving inner text. Attributes on allowed tags are
 * preserved as-is. A real implementation will also sanitize attributes/URLs.
 */
export function filter(html: string, allowedTags: readonly string[] = ADMIN_TAG_LIST): string {
  const allowed = new Set(allowedTags.map((t) => t.toLowerCase()));
  return html.replace(/<\/?([a-zA-Z0-9]+)\b[^>]*>/g, (match, tagName: string) => {
    return allowed.has(tagName.toLowerCase()) ? match : '';
  });
}

/** Filters using the admin tag list (Xss::filterAdmin()). */
export function filterAdmin(html: string): string {
  return filter(html, ADMIN_TAG_LIST);
}
