/**
 * Hook implementations for the `big_pipe` module.
 *
 * Source: drupal-core/core/modules/big_pipe/src/Hook/BigPipeHooks.php
 *
 * The PHP class declares each hook with a `#[Hook(...)]` attribute; discovery is
 * handled here by {@link registerBigPipeHooks}, which calls the (ported)
 * `@drupaljs/hook` ModuleHandler's `implement()` for each one — the TS-idiomatic
 * equivalent of attribute discovery.
 *
 * Because `pageAttachments` reads ambient services (`\Drupal::routeMatch()`,
 * `\Drupal::request()`, `session_configuration`, `redirect.destination`) in the
 * original, those inputs are passed explicitly as a context object here, keeping
 * the hook a pure transform over its mutable `page` argument.
 */

import { NOJS_COOKIE } from './big-pipe-strategy.js';
import type { HookRegistrarLike } from './types.js';

/** This module's machine name. */
export const BIG_PIPE_MODULE_NAME = 'big_pipe';

/** A theme hook definition produced by `hook_theme()`. */
export interface ThemeHook {
  variables: Record<string, unknown>;
}

/** The theme registry slice returned by {@link bigPipeTheme}. */
export interface BigPipeThemeRegistry {
  big_pipe_interface_preview: ThemeHook;
}

/** An html_head element: a render array plus its unique string key. */
export type HtmlHeadElement = [Record<string, unknown>, string];

/** Mutable `page` render array passed to {@link bigPipePageAttachments}. */
export interface PageAttachments {
  '#cache'?: { contexts?: string[] };
  '#attached'?: { html_head?: HtmlHeadElement[] };
}

/** Ambient inputs for {@link bigPipePageAttachments} (the `\Drupal::*` reads). */
export interface PageAttachmentsContext {
  /** Whether the current route opted out via `_no_big_pipe`. */
  noBigPipe: boolean;
  /** Whether the current request has a session. */
  sessionExists: boolean;
  /** Whether the no-JS cookie is set on the current request. */
  hasNoJsCookie: boolean;
  /** Resolved URL for the `big_pipe.nojs` route incl. the destination query. */
  nojsRedirectUrl: string;
}

/**
 * Implements `hook_help()`. Ports `BigPipeHooks::help()` (markup trimmed to the
 * structural content; the full HTML is reproducible from the source).
 */
export function bigPipeHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.big_pipe':
      return (
        'The BigPipe module sends pages with dynamic content in a way that ' +
        'allows browsers to show them much faster. The module requires no ' +
        'configuration.'
      );
    default:
      return null;
  }
}

/**
 * Implements `hook_theme()`. Ports `BigPipeHooks::theme()`.
 */
export function bigPipeTheme(): BigPipeThemeRegistry {
  return {
    big_pipe_interface_preview: {
      variables: { callback: null, arguments: null, preview: null },
    },
  };
}

/**
 * Implements `hook_page_attachments()`. Ports `BigPipeHooks::pageAttachments()`.
 *
 * Adds the `session.exists` and no-JS cookie cache contexts, and — when a
 * session exists — either a noscript `Refresh` meta tag (to set the no-JS cookie
 * via {@link BigPipeController.setNoJsCookie}) or a script that deletes the
 * cookie once JavaScript proves available.
 *
 * @param page - Mutated in place, mirroring the by-reference PHP signature.
 */
export function bigPipePageAttachments(
  page: PageAttachments,
  ctx: PageAttachmentsContext,
): void {
  // Routes that don't use BigPipe also don't need no-JS detection.
  if (ctx.noBigPipe) {
    return;
  }

  const cache = (page['#cache'] ??= {});
  (cache.contexts ??= []).push('session.exists');
  cache.contexts.push(`cookies:${NOJS_COOKIE}`);

  if (!ctx.sessionExists) {
    return;
  }

  const attached = (page['#attached'] ??= {});
  const head = (attached.html_head ??= []);

  if (!ctx.hasNoJsCookie) {
    // Let the server set the BigPipe no-JS cookie via a noscript redirect.
    head.push([
      {
        '#tag': 'meta',
        '#noscript': true,
        '#attributes': {
          'http-equiv': 'Refresh',
          content: `0; URL=${ctx.nojsRedirectUrl}`,
        },
      },
      'big_pipe_detect_nojs',
    ]);
  } else {
    // Let the client delete the BigPipe no-JS cookie now that JS is available.
    head.push([
      {
        '#tag': 'script',
        '#value': `document.cookie = "${NOJS_COOKIE}=1; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"`,
      },
      'big_pipe_detect_js',
    ]);
  }
}

/**
 * Registers every ported `big_pipe` hook implementation with a module handler —
 * the TS equivalent of `#[Hook(...)]` attribute discovery.
 */
export function registerBigPipeHooks(handler: HookRegistrarLike): void {
  handler.implement(BIG_PIPE_MODULE_NAME, 'help', (routeName: string) =>
    bigPipeHelp(routeName),
  );
  handler.implement(
    BIG_PIPE_MODULE_NAME,
    'page_attachments',
    (page: PageAttachments, ctx: PageAttachmentsContext) =>
      bigPipePageAttachments(page, ctx),
  );
  handler.implement(BIG_PIPE_MODULE_NAME, 'theme', () => bigPipeTheme());
}
