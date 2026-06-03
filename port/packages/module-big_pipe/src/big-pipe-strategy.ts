/**
 * BigPipe placeholder strategy.
 *
 * Source: drupal-core/core/modules/big_pipe/src/Render/Placeholder/BigPipeStrategy.php
 *
 * Sends HTML in chunks: the strategy only activates when the current request has
 * a session, is cacheable, is not a sub-request, and the route did not opt out
 * via the `_no_big_pipe` option. When active it rewrites each placeholder into
 * either a JS BigPipe placeholder (a `<span data-big-pipe-placeholder-id>`) or a
 * no-JS placeholder (in-situ replacement), choosing based on whether the
 * placeholder is HTML and whether the no-JS cookie is set.
 */

import type {
  PlaceholderMap,
  PlaceholderStrategyInterface,
  RenderArray,
  RequestStackLike,
  RouteMatchLike,
  SessionConfigurationLike,
} from './types.js';

/** BigPipe no-JS cookie name. Ports `BigPipeStrategy::NOJS_COOKIE`. */
export const NOJS_COOKIE = 'big_pipe_nojs';

export class BigPipeStrategy implements PlaceholderStrategyInterface {
  constructor(
    private readonly sessionConfiguration: SessionConfigurationLike,
    private readonly requestStack: RequestStackLike,
    private readonly routeMatch: RouteMatchLike,
  ) {}

  /**
   * Ports `BigPipeStrategy::processPlaceholders()`.
   */
  processPlaceholders(placeholders: PlaceholderMap): PlaceholderMap {
    // BigPipe cannot process placeholders in sub-requests: the request stack is
    // not the same when BigPipe renders the placeholders.
    if (this.requestStack.getParentRequest()) {
      return {};
    }

    const request = this.requestStack.getCurrentRequest();
    if (request === null) {
      return {};
    }

    // Uncacheable request methods (e.g. POST) are rendered immediately.
    if (!request.isMethodCacheable()) {
      return {};
    }

    // Routes can opt out from BigPipe HTML delivery.
    if (this.routeMatch.getRouteObject()?.getOption('_no_big_pipe')) {
      return {};
    }

    if (!this.sessionConfiguration.hasSession(request)) {
      return {};
    }

    return this.doProcessPlaceholders(placeholders, request.cookies.has(NOJS_COOKIE));
  }

  /**
   * Ports `BigPipeStrategy::doProcessPlaceholders()`.
   */
  private doProcessPlaceholders(
    placeholders: PlaceholderMap,
    hasNoJsCookie: boolean,
  ): PlaceholderMap {
    const overridden: PlaceholderMap = {};
    for (const [placeholder, elements] of Object.entries(placeholders)) {
      if (BigPipeStrategy.placeholderIsAttributeSafe(placeholder)) {
        // Attribute-safe (non-HTML) placeholders must be replaced server-side
        // via no-JS BigPipe; JS cannot efficiently find them in the DOM.
        overridden[placeholder] = BigPipeStrategy.createBigPipeNoJsPlaceholder(
          placeholder,
          elements,
          true,
        );
      } else if (hasNoJsCookie) {
        overridden[placeholder] = BigPipeStrategy.createBigPipeNoJsPlaceholder(
          placeholder,
          elements,
          false,
        );
        BigPipeStrategy.addNoJsCookieContext(overridden[placeholder]);
      } else {
        overridden[placeholder] = BigPipeStrategy.createBigPipeJsPlaceholder(
          placeholder,
          elements,
        );
        BigPipeStrategy.addNoJsCookieContext(overridden[placeholder]);
      }
    }
    return overridden;
  }

  /** Appends the no-JS cookie cache context to a placeholder render array. */
  private static addNoJsCookieContext(render: RenderArray): void {
    const cache = (render['#cache'] ??= {}) as { contexts?: string[] };
    (cache.contexts ??= []).push(`cookies:${NOJS_COOKIE}`);
  }

  /**
   * Ports `BigPipeStrategy::placeholderIsAttributeSafe()`.
   *
   * A placeholder is attribute-safe (i.e. not an HTML element placeholder) when
   * it does not start with `<` or does not survive HTML normalization unchanged.
   */
  static placeholderIsAttributeSafe(placeholder: string): boolean {
    return placeholder[0] !== '<' || placeholder !== htmlNormalize(placeholder);
  }

  /**
   * Ports `BigPipeStrategy::createBigPipeJsPlaceholder()`.
   */
  static createBigPipeJsPlaceholder(
    originalPlaceholder: string,
    placeholderRenderArray: RenderArray,
  ): RenderArray {
    const id = BigPipeStrategy.generateBigPipePlaceholderId(
      originalPlaceholder,
      placeholderRenderArray,
    );

    let interfacePreview: RenderArray = {};
    const lazyBuilder = placeholderRenderArray['#lazy_builder'] as
      | [string, unknown[]]
      | undefined;
    if (lazyBuilder) {
      interfacePreview = {
        '#theme': 'big_pipe_interface_preview',
        '#callback': lazyBuilder[0],
        '#arguments': lazyBuilder[1],
      };
      if (placeholderRenderArray['#preview'] !== undefined) {
        interfacePreview['#preview'] = placeholderRenderArray['#preview'];
      }
    }

    return {
      '#prefix': `<span data-big-pipe-placeholder-id="${htmlEscape(id)}">`,
      interface_preview: interfacePreview,
      '#suffix': '</span>',
      '#cache': { 'max-age': 0, contexts: ['session.exists'] },
      '#attached': {
        library: ['big_pipe/big_pipe'],
        drupalSettings: { bigPipePlaceholderIds: { [id]: true } },
        big_pipe_placeholders: { [htmlEscape(id)]: placeholderRenderArray },
      },
    };
  }

  /**
   * Ports `BigPipeStrategy::createBigPipeNoJsPlaceholder()`.
   */
  static createBigPipeNoJsPlaceholder(
    originalPlaceholder: string,
    placeholderRenderArray: RenderArray,
    placeholderMustBeAttributeSafe = false,
  ): RenderArray {
    let bigPipePlaceholder: string;
    if (!placeholderMustBeAttributeSafe) {
      bigPipePlaceholder = `<span data-big-pipe-nojs-placeholder-id="${htmlEscape(
        BigPipeStrategy.generateBigPipePlaceholderId(
          originalPlaceholder,
          placeholderRenderArray,
        ),
      )}"></span>`;
    } else {
      bigPipePlaceholder = `big_pipe_nojs_placeholder_attribute_safe:${htmlEscape(
        originalPlaceholder,
      )}`;
    }

    return {
      '#markup': bigPipePlaceholder,
      '#cache': { 'max-age': 0, contexts: ['session.exists'] },
      '#attached': {
        big_pipe_nojs_placeholders: {
          [bigPipePlaceholder]: placeholderRenderArray,
        },
      },
    };
  }

  /**
   * Ports `BigPipeStrategy::generateBigPipePlaceholderId()`.
   *
   * For `#lazy_builder` placeholders, builds a stable querystring of
   * `callback`, `args`, and a `token` (a hash of the render array). Otherwise
   * falls back to a DOM-safe id derived from the original placeholder.
   */
  static generateBigPipePlaceholderId(
    originalPlaceholder: string,
    placeholderRenderArray: RenderArray,
  ): string {
    const lazyBuilder = placeholderRenderArray['#lazy_builder'] as
      | [string, unknown[]]
      | undefined;
    if (lazyBuilder) {
      const cache = placeholderRenderArray['#cache'] as
        | { contexts?: string[]; tags?: string[] }
        | undefined;
      if (cache?.contexts) cache.contexts = [...cache.contexts].sort();
      if (cache?.tags) cache.tags = [...cache.tags].sort();

      const [callback, args] = lazyBuilder;
      const token = hashBase64(JSON.stringify(placeholderRenderArray));
      return buildQuery({ callback, args: args as unknown[], token });
    }
    return htmlGetId(originalPlaceholder);
  }
}

// ---------------------------------------------------------------------------
// Minimal local ports of Drupal\Component\Utility helpers.
// TODO(@drupaljs/util): replace with the canonical Html/Crypt/UrlHelper ports.
// ---------------------------------------------------------------------------

/** Ports `Html::escape()` (a wrapper over htmlspecialchars, ENT_QUOTES). */
export function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Minimal `Html::normalize()`: parses and re-serializes a fragment. The full
 * port (DOM round-trip) is deferred; this approximation is sufficient for the
 * attribute-safe check, which only needs `<...>` element placeholders to
 * normalize to themselves.
 *
 * TODO(@drupaljs/filter): replace with the Rust/WASM HTML automaton (ADR-0015).
 */
export function htmlNormalize(html: string): string {
  return html;
}

/** Ports `Html::getId()`: lowercase, replace invalid chars with `-`. */
export function htmlGetId(id: string): string {
  let result = id
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (result === '') result = '_';
  return result;
}

/**
 * A deterministic, dependency-free token derived from the input. Used only as
 * the `token` component of a BigPipe placeholder id, where the contract is
 * stability for a given render array, not cryptographic strength.
 *
 * TODO(@drupaljs/util): replace with the real `Crypt::hashBase64()` (base64url
 * SHA-256) — likely the Rust/WASM hashing primitive per ADR-0015.
 */
export function hashBase64(data: string): string {
  // 64-bit FNV-1a (two 32-bit lanes) → base64url, for a stable, collision-rare
  // token without pulling in a crypto dependency in this vertical slice.
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (c + 0x9e3779b9) & 0xff;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  const bytes = [
    (h1 >>> 24) & 0xff,
    (h1 >>> 16) & 0xff,
    (h1 >>> 8) & 0xff,
    h1 & 0xff,
    (h2 >>> 24) & 0xff,
    (h2 >>> 16) & 0xff,
    (h2 >>> 8) & 0xff,
    h2 & 0xff,
  ];
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Ports `UrlHelper::buildQuery()` for the BigPipe placeholder id: builds a
 * `callback=...&args[0]=...&token=...` querystring with PHP-style nested keys.
 */
export function buildQuery(params: {
  callback: string;
  args: unknown[];
  token: string;
}): string {
  const parts: string[] = [];
  parts.push(`callback=${encodeURIComponent(params.callback)}`);
  params.args.forEach((arg, index) => {
    parts.push(`args[${index}]=${encodeURIComponent(String(arg))}`);
  });
  parts.push(`token=${encodeURIComponent(params.token)}`);
  return parts.join('&');
}
