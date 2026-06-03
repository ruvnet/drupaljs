/**
 * @drupaljs/module-update — TypeScript port of Drupal core's `update` module
 * (drupal-core/core/modules/update).
 *
 * This is a faithful but minimal vertical slice of the Update Status subsystem:
 *
 * - Status constants ({@link UpdateFetcherStatus}, {@link UpdateManagerStatus}),
 *   ported from `UpdateFetcherInterface` / `UpdateManagerInterface`.
 * - {@link ProjectRelease} — the release value object, with the same validation
 *   contract as the PHP original.
 * - {@link UpdateFetcher} — release-history URL construction + fetch, with the
 *   network layer behind an injectable {@link HttpClient} seam.
 * - {@link calculateProjectUpdateStatus} — the core compare algorithm from
 *   `update.compare.inc` that decides whether a project is current, has a
 *   (security) update, is unsupported, revoked, etc.
 * - {@link updateRoutes} / {@link updatePermissions} — ports of
 *   `update.routing.yml` and `update.permissions.yml`.
 * - {@link registerUpdateHooks} / {@link updateHelp} — the module's hook
 *   implementations, registered via @drupaljs/hook.
 *
 * Deep external dependencies (HTTP client, full ExtensionVersion, routing/URL
 * generation, render/theme layer) are stubbed with minimal local types marked
 * with TODO and will be wired up as those packages land.
 */

export * from './constants.js';
export * from './version.js';
export * from './project-release.js';
export * from './update-fetcher.js';
export * from './compare.js';
export * from './permissions.js';
export * from './routing.js';
export * from './hooks.js';
