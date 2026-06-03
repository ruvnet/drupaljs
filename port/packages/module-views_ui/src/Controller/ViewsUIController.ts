/**
 * Route handlers for views_ui.
 *
 * Ports the behavioural core of `Drupal\views_ui\Controller\ViewsUIController`:
 * - {@link ViewsUIController.ajaxOperation} enable/disable a view and either
 *   return a list-replace AJAX command or a redirect.
 * - {@link ViewsUIController.autocompleteTag} matches view tags for the tag
 *   autocomplete (including `Tags::explode` parsing).
 *
 * The reports (`reportFields`/`reportPlugins`) and `edit` controller depend on
 * the not-yet-ported Views data/handler subsystem and are out of scope here.
 */

import type { ViewEntityLike } from '../contracts.js';

/** An autocomplete match entry: `{ value, label }`. */
export interface TagMatch {
  value: string;
  label: string;
}

/**
 * A view exposing the `enable`/`disable` lifecycle used by
 * {@link ViewsUIController.ajaxOperation}.
 */
export interface OperableView extends ViewEntityLike {
  enable(): void;
  disable(): void;
  save(): void;
}

/** Result of {@link ViewsUIController.ajaxOperation}. */
export type AjaxOperationResult =
  | { type: 'ajax'; command: 'replace'; selector: '#views-entity-list' }
  | { type: 'redirect'; route: 'entity.view.collection' };

/**
 * Splits a comma/quote-delimited tag string into individual tags.
 *
 * Ports `Drupal\Core\Component\Utility\Tags::explode()`: tags are separated by
 * commas; a tag containing a comma or quote must be wrapped in double quotes,
 * and embedded `""` is an escaped quote. Surrounding whitespace is trimmed and
 * empty tags are dropped.
 */
export function explodeTags(tags: string): string[] {
  // Matches either a quoted tag (with "" escapes) or an unquoted run up to a comma.
  const regexp = /^"(?:[^"]|"")*"|(?:[^",]|"(?:[^"]|"")*")+/;
  const result: string[] = [];
  let remaining = tags;

  while (remaining.length > 0) {
    const match = regexp.exec(remaining);
    if (match === null) break;
    let term = match[0];
    // Unquote and unescape quoted terms.
    if (term.startsWith('"') && term.endsWith('"') && term.length > 1) {
      term = term.slice(1, -1).replace(/""/g, '"');
    }
    term = term.trim();
    if (term !== '') {
      result.push(term);
    }
    remaining = remaining.slice(match[0].length).replace(/^\s*,?\s*/, '');
  }
  return result;
}

export class ViewsUIController {
  /**
   * Performs an enable/disable operation on a view and saves it.
   *
   * Ports `ViewsUIController::ajaxOperation()`. When the request carries the
   * `js` flag, the caller should replace `#views-entity-list` with the freshly
   * rendered list; otherwise it redirects to the collection route.
   */
  ajaxOperation(view: OperableView, op: 'enable' | 'disable', isJs: boolean): AjaxOperationResult {
    if (op === 'enable') {
      view.enable();
    } else {
      view.disable();
    }
    view.save();

    if (isJs) {
      return { type: 'ajax', command: 'replace', selector: '#views-entity-list' };
    }
    return { type: 'redirect', route: 'entity.view.collection' };
  }

  /**
   * Returns up to 10 distinct tag matches for the autocomplete query.
   *
   * Ports `ViewsUIController::autocompleteTag()`. Tags are gathered from every
   * view's `tag` config, de-duplicated, and matched case-insensitively as a
   * substring of the query.
   */
  autocompleteTag(views: readonly ViewEntityLike[], query: string): TagMatch[] {
    const matches: TagMatch[] = [];
    const seen = new Set<string>();
    const needle = query.toLowerCase();

    outer: for (const view of views) {
      const tagValue = view.get('tag');
      const viewTag = typeof tagValue === 'string' ? tagValue : '';
      for (const tag of explodeTags(viewTag)) {
        if (tag && !seen.has(tag)) {
          seen.add(tag);
          if (tag.toLowerCase().includes(needle)) {
            matches.push({ value: tag, label: escapeHtml(tag) });
            if (matches.length >= 10) {
              break outer;
            }
          }
        }
      }
    }
    return matches;
  }
}

/** Minimal HTML escaping mirroring `Html::escape()` for autocomplete labels. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
