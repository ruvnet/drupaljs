/**
 * @drupaljs/module-contextual — TypeScript port of Drupal core's `contextual`
 * module.
 *
 * Ports a faithful vertical slice of `core/modules/contextual`:
 * - permissions (`access contextual links`)
 * - routes (from `contextual.routing.yml`)
 * - the `ContextualLinksSerializer` service (links <-> ID conversion)
 * - the `ContextualController` render endpoint (token-verified)
 * - the `ContextualLinksNegotiator` theme negotiator
 * - hook implementations (`toolbar`, `page_attachments`, `help`,
 *   `contextual_links_view_alter`) wired through `@drupaljs/hook`.
 *
 * Deep external dependencies (renderer, language manager, HMAC crypto, theme
 * handler, sessions) are modelled with minimal LOCAL contracts marked
 * `TODO(@drupaljs/*)` until the owning packages ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// Service: contextual links serializer.
export { ContextualLinksSerializer } from './ContextualLinksSerializer.js';
export type { ContextualLinks, ContextualLinkGroup } from './ContextualLinksSerializer.js';

// Controller.
export { ContextualController } from './Controller/ContextualController.js';
export type { ContextualRenderResponse } from './Controller/ContextualController.js';

// Theme negotiator.
export { ContextualLinksNegotiator } from './Theme/ContextualLinksNegotiator.js';
export type {
  RouteMatchLike,
  ThemeHandlerLike,
  ContextualThemeQuery,
} from './Theme/ContextualLinksNegotiator.js';

// Hooks + registration.
export { ContextualHooks } from './Hook/ContextualHooks.js';
export type { ToolbarItems } from './Hook/ContextualHooks.js';
export { registerContextualHooks, MODULE_NAME } from './Hook/register.js';
