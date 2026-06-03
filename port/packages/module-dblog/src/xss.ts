/**
 * Minimal admin XSS filtering used by the dblog controller.
 *
 * Ports a narrow slice of `Drupal\Component\Utility\Xss::filterAdmin()`: it
 * strips disallowed tags (notably `<script>` and its contents and event-handler
 * attributes) while leaving the broad "admin" tag allow-list intact. The full
 * Xss filter is a tag/attribute automaton earmarked for Rust/WASM (ADR-0015);
 * this stub keeps the controller testable until that crate lands.
 *
 * TODO(crates/xss-filter): replace with the WASM-backed Xss filter so the full
 * allow-list, attribute scrubbing and entity handling match Drupal exactly.
 */

/** Tags that are removed entirely (tag + contents) before any other filtering. */
const STRIP_WITH_CONTENT = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** Inline event-handler attributes (onclick, onerror, ...). */
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

/** `javascript:` URIs in href/src attributes. */
const JS_URI = /(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi;

/**
 * Filters a string for safe display in administrative contexts.
 *
 * @param input Untrusted message text (may contain markup).
 * @returns The filtered string.
 */
export function filterAdmin(input: string): string {
  return input
    .replace(STRIP_WITH_CONTENT, '')
    .replace(EVENT_HANDLER_ATTR, '')
    .replace(JS_URI, '$1=$2$2');
}
