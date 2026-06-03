/**
 * Render-array type definitions.
 *
 * Port of Drupal's renderable-array contract (see RendererInterface::render()
 * docs and theme.api.php). A render array is a tree where keys beginning with
 * '#' are *properties* of the element and all other keys are *children*
 * (themselves render arrays).
 *
 * This intentionally types only the subset of properties this package handles
 * (#markup, #plain_text, #children, #prefix/#suffix, #theme, #cache, #attached,
 * #weight, #access, #printed, #allowed_tags). It stays open-ended via an index
 * signature so other subsystems' properties (e.g. #pre_render, #lazy_builder)
 * and arbitrary children pass through untouched.
 */

import type { MarkupInterface } from './markup.js';
import type { Attachments } from './bubbleable-metadata.js';

/** Cache metadata carried on a render element under the `#cache` key. */
export interface RenderCacheMetadata {
  tags?: string[];
  contexts?: string[];
  'max-age'?: number;
  /** Cache keys identifying a render-cacheable subtree. */
  keys?: string[];
  /** Cache bin name. */
  bin?: string;
}

/**
 * Access result. The full AccessResultInterface lives in the access package
 * (out of scope). TODO: replace the boolean-only handling with that interface
 * once @drupaljs/access exists.
 */
export type AccessResult = boolean;

/**
 * A Drupal render array.
 *
 * Properties (`#`-prefixed) are typed where this package consumes them; all
 * other string keys are treated as child render arrays.
 */
export interface RenderArray {
  /** Raw markup, XSS-filtered (admin tag list) unless already a Markup object. */
  '#markup'?: string | MarkupInterface;
  /** Plain text; HTML-escaped. Takes precedence over #markup for safety. */
  '#plain_text'?: string;
  /** Rendered child output; populated by the renderer. */
  '#children'?: string | MarkupInterface;
  /** Markup prepended to #children (XSS-filtered). */
  '#prefix'?: string | MarkupInterface;
  /** Markup appended to #children (XSS-filtered). */
  '#suffix'?: string | MarkupInterface;
  /** Theme hook to render this element with. */
  '#theme'?: string;
  /** Cacheability metadata. */
  '#cache'?: RenderCacheMetadata;
  /** Attached assets/settings/placeholders (bubbleable). */
  '#attached'?: Attachments;
  /** Sort weight among siblings. */
  '#weight'?: number;
  /** Whether the current user may see this element. */
  '#access'?: AccessResult;
  /** Set once an element has been rendered, to prevent double rendering. */
  '#printed'?: boolean;
  /** Marks children as already weight-sorted. */
  '#sorted'?: boolean;
  /** Tag allow-list for the #markup XSS filter. */
  '#allowed_tags'?: string[];
  /** When set, theme/theme_wrappers are skipped to avoid recursion. */
  '#render_children'?: boolean;

  // Children and any other (e.g. as-yet-unported) properties.
  [key: string]: unknown;
}
