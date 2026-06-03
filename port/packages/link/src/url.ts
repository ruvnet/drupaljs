/**
 * Minimal `Url` value object, ported from the slice of `Drupal\Core\Url` that
 * the link field type and formatter rely on.
 */
import type { LinkOptions } from './types.js';
import { isExternalUri, parseUri } from './url-helper.js';

// TODO(@drupaljs/url): replace with the full Url subsystem port. This local
// implementation resolves only the link-relevant cases (external absolute URLs
// and internal: pseudo-scheme paths) into an href string.

/**
 * A resolvable URL built from a stored link URI plus its options.
 */
export class Url {
  private constructor(
    private readonly uri: string,
    private options: LinkOptions,
    private readonly external: boolean,
  ) {}

  /**
   * Builds a {@link Url} from a stored link URI.
   *
   * Mirrors `Url::fromUri()`. Throws on an empty URI to match the field type's
   * `getUrl()` contract (callers catch this to fall back to `<none>`).
   */
  static fromUri(uri: string | null | undefined, options: LinkOptions = {}): Url {
    if (uri === null || uri === undefined || uri === '') {
      throw new Error('Cannot build a Url from an empty URI.');
    }
    return new Url(uri, { ...options }, isExternalUri(uri));
  }

  /** Whether the link points to an external resource. */
  isExternal(): boolean {
    return this.external;
  }

  /** Returns the raw, unresolved URI string. */
  getUri(): string {
    return this.uri;
  }

  /** Returns the current option set. */
  getOptions(): LinkOptions {
    return this.options;
  }

  /** Replaces the option set. */
  setOptions(options: LinkOptions): void {
    this.options = options;
  }

  /**
   * Renders the URL to an href string.
   *
   * External URIs are returned as-is (with query/fragment from options merged
   * in if not already present). Internal pseudo-scheme URIs are resolved to a
   * root-relative path. Query parameters and the fragment from the option set
   * are appended.
   */
  toString(): string {
    const parsed = parseUri(this.uri);
    let base: string;
    if (this.external) {
      base = parsed.path;
    } else {
      // Internal: ensure a leading slash for root-relative output.
      base = parsed.path.startsWith('/') ? parsed.path : `/${parsed.path}`;
    }

    // Merge query: options take precedence, falling back to the uri's own query.
    const query = { ...parsed.query, ...(this.options.query ?? {}) };
    const queryString = Object.entries(query)
      .map(([k, v]) =>
        v === '' ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
      )
      .join('&');

    const fragment = this.options.fragment ?? parsed.fragment;

    let result = base;
    if (queryString !== '') {
      result += `?${queryString}`;
    }
    if (fragment !== '' && fragment !== undefined) {
      result += `#${fragment}`;
    }
    return result;
  }
}
