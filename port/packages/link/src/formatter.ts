/**
 * Link field formatter, ported from
 * `Drupal\link\Plugin\Field\FieldFormatter\LinkFormatter`.
 *
 * Produces a framework-agnostic {@link LinkRenderElement} for each item; a
 * render/theme layer is responsible for turning it into HTML.
 */
import type { LinkItem } from './link-item.js';
import type { LinkFormatterSettings, LinkOptions, LinkRenderElement } from './types.js';
import { Url } from './url.js';
import { filterBadProtocol } from './url-helper.js';

/**
 * Truncates a string to `max` characters, appending an ellipsis when trimmed.
 *
 * Approximates `Unicode::truncate($text, $max, FALSE, TRUE)` (word-unaware,
 * with ellipsis). The ellipsis counts toward the limit.
 */
export function truncate(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) {
    return text;
  }
  if (max <= 1) {
    return '…';
  }
  return chars.slice(0, max - 1).join('') + '…';
}

/**
 * Sanitizes an attribute map, stripping bad protocols from URI-bearing values.
 *
 * A minimal port of `AttributeXss::sanitizeAttributes()` covering the common
 * case: scalar string values are run through {@link filterBadProtocol}; the
 * `class` attribute is preserved as an array; boolean (valueless) attributes
 * pass through unchanged.
 */
export function sanitizeAttributes(
  attributes: Record<string, string | string[] | boolean>,
): Record<string, string | string[] | boolean> {
  const safe: Record<string, string | string[] | boolean> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (typeof value === 'boolean') {
      safe[name] = value;
      continue;
    }
    if (Array.isArray(value)) {
      safe[name] = value;
      continue;
    }
    // Attributes whose values are never URIs are not protocol-filtered.
    const skipProtocolFiltering =
      name.startsWith('data-') ||
      ['title', 'alt', 'rel', 'property', 'class', 'datetime'].includes(name);
    safe[name] = skipProtocolFiltering ? value : filterBadProtocol(value);
  }
  return safe;
}

/**
 * Builds the resolved {@link Url} for an item, applying formatter settings.
 *
 * Mirrors `LinkFormatter::buildUrl()`. Falls back to a `<none>`-style URL when
 * the item URI cannot be resolved.
 */
function buildUrl(item: LinkItem, settings: LinkFormatterSettings): Url {
  let url: Url;
  try {
    url = item.getUrl();
  } catch {
    // Mirrors Url::fromRoute('<none>'): an unresolvable link points nowhere.
    url = Url.fromUri('route:<none>');
  }

  const options: LinkOptions = { ...(item.options ?? {}), ...url.getOptions() };

  if (settings.rel !== '') {
    options.attributes = { ...(options.attributes ?? {}), rel: settings.rel };
  }
  if (settings.target !== '') {
    options.attributes = { ...(options.attributes ?? {}), target: settings.target };
  }
  if (options.attributes && Object.keys(options.attributes).length > 0) {
    options.attributes = sanitizeAttributes(options.attributes);
  }

  url.setOptions(options);
  return url;
}

/**
 * Renders a single link item to a {@link LinkRenderElement}.
 *
 * Mirrors the per-item branch of `LinkFormatter::viewElements()`.
 */
export function formatLinkItem(
  item: LinkItem,
  settings: LinkFormatterSettings,
): LinkRenderElement {
  const url = buildUrl(item, settings);
  // By default use the full URL as the link text.
  let linkTitle = url.toString();

  const title = item.getTitle();
  if (!settings.url_only && title !== null) {
    linkTitle = title;
  }

  if (settings.trim_length !== '' && settings.trim_length > 0) {
    linkTitle = truncate(linkTitle, settings.trim_length);
  }

  if (settings.url_only && settings.url_plain) {
    return { type: 'plain_text', text: linkTitle };
  }

  const element: LinkRenderElement = {
    type: 'link',
    title: linkTitle,
    url: url.toString(),
  };
  const attributes = url.getOptions().attributes;
  if (attributes && Object.keys(attributes).length > 0) {
    element.attributes = attributes;
  }
  return element;
}

/**
 * Renders a list of link items.
 *
 * Mirrors `LinkFormatter::viewElements()` over a field item list.
 */
export function formatLinkItems(
  items: readonly LinkItem[],
  settings: LinkFormatterSettings,
): LinkRenderElement[] {
  return items.map((item) => formatLinkItem(item, settings));
}
