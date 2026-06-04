/**
 * @drupaljs/module-big_pipe — TypeScript port of Drupal Core's `big_pipe` module.
 *
 * Source: drupal-core/core/modules/big_pipe/*
 *
 * BigPipe sends pages with dynamic content in chunks so browsers can render the
 * static shell immediately and stream placeholder replacements afterwards. This
 * package ports the module's server-side surface:
 *
 * - **Placeholder strategy**: {@link BigPipeStrategy} (the core algorithm) —
 *   gates on session/method/sub-request/route opt-out, then rewrites each
 *   placeholder into a JS or no-JS BigPipe placeholder.
 * - **Controller**: {@link BigPipeController} — backs the `big_pipe.nojs` route,
 *   sets the no-JS cookie and redirects back.
 * - **Route subscriber**: {@link NoBigPipeRouteAlterSubscriber} — opts the batch
 *   and modules-list routes out of BigPipe.
 * - **Hooks**: {@link registerBigPipeHooks} (registers `help`,
 *   `page_attachments`, `theme` via `@drupaljs/hook`) plus the hook functions.
 * - **Routes**: {@link BIG_PIPE_ROUTES}.
 * - **Seam types**: minimal render / routing / session / HTTP contracts carrying
 *   TODO markers until the canonical `@drupaljs/*` packages land.
 *
 * Deep dependencies (the streaming `BigPipe` renderer itself, the
 * `BigPipeResponse`, and the attachments processor) are out of scope for this
 * vertical slice and are noted as TODO.
 */

export type {
  RenderArray,
  PlaceholderMap,
  PlaceholderStrategyInterface,
  RequestLike,
  RequestStackLike,
  RouteLike,
  RouteMatchLike,
  SessionConfigurationLike,
  RouteCollectionLike,
  RouteBuildEventLike,
  HookRegistrarLike,
} from './types.js';

export {
  BigPipeStrategy,
  NOJS_COOKIE,
  htmlEscape,
  htmlNormalize,
  htmlGetId,
  hashBase64,
  buildQuery,
} from './big-pipe-strategy.js';

export {
  BigPipeController,
  AccessDeniedHttpException,
  BadRequestHttpException,
  type ResponseCookie,
  type LocalRedirectResponseLike,
} from './big-pipe-controller.js';

export {
  NoBigPipeRouteAlterSubscriber,
  NO_BIG_PIPE_ROUTES,
  ROUTING_ALTER_EVENT,
} from './no-big-pipe-route-subscriber.js';

export {
  BIG_PIPE_MODULE_NAME,
  bigPipeHelp,
  bigPipeTheme,
  bigPipePageAttachments,
  registerBigPipeHooks,
  type ThemeHook,
  type BigPipeThemeRegistry,
  type HtmlHeadElement,
  type PageAttachments,
  type PageAttachmentsContext,
} from './hooks.js';

export { BIG_PIPE_ROUTES, type RouteDefinition } from './routes.js';
