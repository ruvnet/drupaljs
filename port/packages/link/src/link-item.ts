/**
 * Link field item, ported from
 * `Drupal\link\Plugin\Field\FieldType\LinkItem`.
 *
 * Holds a `uri` / `title` / `options` triple and exposes the behaviours the
 * rest of the link subsystem depends on: emptiness, external detection, URL
 * resolution, and the `resolvable_uri` -> `uri` synchronisation.
 */
import type { LinkOptions, LinkValue, LinkValueInput } from './types.js';
import { Url } from './url.js';
import { getUriScheme, parse } from './url-helper.js';

export class LinkItem {
  uri: string | null = null;
  title: string | null = null;
  options: LinkOptions = {};

  /** The field type's main property name. Mirrors `mainPropertyName()`. */
  static mainPropertyName(): 'uri' {
    return 'uri';
  }

  /**
   * Sets the item value.
   *
   * Mirrors `LinkItem::setValue()`: a bare scalar is treated as the main
   * (`uri`) property; options default to an empty object; and a `resolvable_uri`
   * supplied without an explicit `uri` is synchronised into `uri`/`options`.
   */
  setValue(values: LinkValueInput): void {
    if (values === null || values === undefined) {
      this.uri = null;
      this.title = null;
      this.options = {};
      return;
    }

    if (typeof values !== 'object') {
      this.uri = String(values);
      this.title = null;
      this.options = {};
      return;
    }

    const hasResolvable = Object.prototype.hasOwnProperty.call(
      values,
      'resolvable_uri',
    );
    const hasUri = Object.prototype.hasOwnProperty.call(values, 'uri');

    this.uri = values.uri ?? null;
    this.title = values.title ?? null;
    this.options = values.options ?? {};

    // Support setting only the computed resolvable_uri property: keep uri and
    // options in sync. NULL is a valid resolvable value, hence the key check.
    if (hasResolvable && !hasUri) {
      this.onChange('resolvable_uri', values.resolvable_uri ?? null);
    }
  }

  /** Returns the raw stored value. */
  getValue(): LinkValue {
    return { uri: this.uri, title: this.title, options: this.options };
  }

  /**
   * Keeps `uri`/`options` synchronised when `resolvable_uri` changes.
   *
   * Mirrors `LinkItem::onChange()`. A schemeless path is prefixed with
   * `internal:` so it becomes a valid stored URI.
   */
  onChange(propertyName: string, value: string | null): void {
    if (propertyName !== 'resolvable_uri') {
      return;
    }
    if (value === null || value === '') {
      return;
    }
    const parsed = parse(value);
    let path = parsed.path;
    // If the path is not already an external URL (has no scheme) add the
    // 'internal:' prefix to make it a valid uri.
    if (getUriScheme(path) === null) {
      path = `internal:${path}`;
    }
    this.uri = path;

    if (
      Object.keys(parsed.query).length > 0 ||
      (parsed.fragment !== '' && parsed.fragment !== undefined)
    ) {
      const next: LinkOptions = {};
      if (Object.keys(parsed.query).length > 0) {
        next.query = parsed.query;
      }
      if (parsed.fragment !== '') {
        next.fragment = parsed.fragment;
      }
      this.options = next;
    }
  }

  /** Mirrors `LinkItem::isEmpty()`. */
  isEmpty(): boolean {
    return this.uri === null || this.uri === '';
  }

  /** Mirrors `LinkItem::isExternal()`. */
  isExternal(): boolean {
    return this.getUrl().isExternal();
  }

  /**
   * Resolves the item to a {@link Url}.
   *
   * Mirrors `LinkItem::getUrl()`. Throws when the URI is empty/invalid.
   */
  getUrl(): Url {
    return Url.fromUri(this.uri, this.options);
  }

  /** Mirrors `LinkItem::getTitle()`: returns null for an empty title. */
  getTitle(): string | null {
    return this.title !== null && this.title !== '' ? this.title : null;
  }
}
