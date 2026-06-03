/**
 * @drupaljs/module-tour — TypeScript port of Drupal core's `tour` module.
 *
 * Ports a faithful vertical slice of the tour module:
 * - permissions (`access tour`) and routes (from `tour.routing.yml`)
 * - the `Tour` config entity (`Drupal\tour\Entity\Tour`)
 * - the tip plugin system (`TipPluginInterface` / `TipPluginBase` /
 *   `TipPluginText`)
 * - the `TourManager` route-aware discovery/access service
 * - the `TourController` render path (`#theme => 'tour'`)
 * - hook implementations (`help`, `page_attachments`) wired through
 *   `@drupaljs/hook`.
 *
 * Deep external dependencies (entity storage, renderer, routing, sessions) are
 * modelled with minimal LOCAL contracts marked `TODO(@drupaljs/*)` until the
 * owning packages ship.
 */

// Contracts (local stubs for not-yet-ported dependencies).
export * from './contracts.js';

// Permissions & routes.
export * from './permissions.js';
export * from './routes.js';

// Config entity.
export { Tour } from './Entity/Tour.js';
export type { TourConfiguration, TourRoute } from './Entity/Tour.js';

// Tip plugins.
export { TipPluginBase } from './Plugin/tip/TipPluginInterface.js';
export type {
  TipPluginInterface,
  TipConfiguration,
} from './Plugin/tip/TipPluginInterface.js';
export { TipPluginText } from './Plugin/tip/TipPluginText.js';
export type { TextTipConfiguration } from './Plugin/tip/TipPluginText.js';

// Discovery service.
export { TourManager } from './TourManager.js';

// Controller.
export { TourController } from './Controller/TourController.js';

// Hooks + registration.
export { TourHooks } from './Hook/TourHooks.js';
export { registerTourHooks, MODULE_NAME } from './Hook/register.js';
