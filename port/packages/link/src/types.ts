/**
 * Local type definitions for the link field type.
 *
 * Ported from Drupal core `core/modules/link`. These are minimal local types
 * standing in for shared `@drupaljs/*` contracts that do not yet exist.
 */

// TODO(@drupaljs/field): replace with the shared FieldItem / FieldDefinition
// contracts once the field subsystem package is ported. For now we model only
// the surface the link field type and formatters require.

/**
 * Link option set, mirroring Drupal's `Url` options array.
 *
 * Stored serialized in the `options` column of a link field item.
 */
export interface LinkOptions {
  query?: Record<string, string> | undefined;
  fragment?: string | undefined;
  /** HTML attributes applied to the rendered anchor (class is an array). */
  attributes?: Record<string, string | string[] | boolean> | undefined;
  /** Whether to treat the URI as already absolute/external. */
  external?: boolean | undefined;
  [key: string]: unknown;
}

/**
 * Raw stored representation of a single link field item value.
 *
 * Mirrors the `uri` / `title` / `options` columns from `LinkItem::schema()`.
 */
export interface LinkValue {
  uri: string | null;
  title?: string | null;
  options?: LinkOptions;
}

/**
 * Partial input accepted by {@link LinkItem.setValue}. A bare string is treated
 * as the main (`uri`) property, mirroring `LinkItem::setValue()`.
 */
export type LinkValueInput =
  | string
  | (Partial<LinkValue> & { resolvable_uri?: string | null })
  | null;

/**
 * Allowed link type bitmask flags.
 *
 * Mirrors `LinkItemInterface::LINK_INTERNAL` etc. The values are bit flags so
 * that `LINK_GENERIC === LINK_INTERNAL | LINK_EXTERNAL`.
 */
export const LinkType = {
  /** Internal URLs only. */
  INTERNAL: 0x01,
  /** External URLs only. */
  EXTERNAL: 0x10,
  /** Both internal and external URLs. */
  GENERIC: 0x11,
} as const;

export type LinkTypeValue = (typeof LinkType)[keyof typeof LinkType];

/**
 * Whether/how the link title (text) subfield is shown.
 *
 * Mirrors `\Drupal\link\LinkTitleVisibility`.
 */
export enum LinkTitleVisibility {
  Disabled = 0,
  Optional = 1,
  Required = 2,
}

/**
 * Per-field settings for a link field.
 *
 * Mirrors `LinkItem::defaultFieldSettings()`.
 */
export interface LinkFieldSettings {
  /** Title visibility setting (see {@link LinkTitleVisibility}). */
  title: LinkTitleVisibility;
  /** Allowed link type bitmask (see {@link LinkType}). */
  link_type: LinkTypeValue;
}

/** Default field settings, mirroring `LinkItem::defaultFieldSettings()`. */
export function defaultFieldSettings(): LinkFieldSettings {
  return {
    title: LinkTitleVisibility.Optional,
    link_type: LinkType.GENERIC,
  };
}

/**
 * Settings for the `link` field formatter.
 *
 * Mirrors `LinkFormatter::defaultSettings()`.
 */
export interface LinkFormatterSettings {
  /** Max link-text length; empty string / 0 means no trimming. */
  trim_length: number | '';
  /** Render the URL only (ignore title). */
  url_only: boolean;
  /** When url_only, render the URL as plain text instead of an anchor. */
  url_plain: boolean;
  /** Value for the `rel` attribute, e.g. 'nofollow'. */
  rel: string;
  /** Value for the `target` attribute, e.g. '_blank'. */
  target: string;
}

/** Default formatter settings, mirroring `LinkFormatter::defaultSettings()`. */
export function defaultFormatterSettings(): LinkFormatterSettings {
  return {
    trim_length: 80,
    url_only: false,
    url_plain: false,
    rel: '',
    target: '',
  };
}

/**
 * Result of rendering a single link item via the formatter.
 *
 * This is a framework-agnostic render descriptor; a render/theme layer turns it
 * into HTML. Mirrors the Drupal render-array shapes produced by
 * `LinkFormatter::viewElements()`.
 */
export type LinkRenderElement =
  | {
      type: 'link';
      title: string;
      url: string;
      attributes?: Record<string, string | string[] | boolean>;
    }
  | {
      type: 'plain_text';
      text: string;
    };

/** A constraint violation produced during validation. */
export interface ConstraintViolation {
  /** Property path the violation applies to (e.g. 'uri' or 'title'). */
  path: string;
  /** Human-readable message with placeholders already replaced. */
  message: string;
}
