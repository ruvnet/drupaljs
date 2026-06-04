/**
 * System module hook implementations — TypeScript port of a slice of
 * `core/modules/system/src/Hook/SystemHooks.php`.
 *
 * Drupal 11 declares hooks with `#[Hook('name')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose plain functions
 * plus {@link registerSystemHooks} which registers them on a
 * `@drupaljs/hook` ModuleHandler via its explicit `implement()` API (the
 * TS-idiomatic equivalent of attribute discovery — see @drupaljs/hook docs).
 *
 * Ported hooks: `hook_cron` (garbage-collect caches & queues) and `hook_help`.
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';

/** Anything exposing `garbageCollection()` (cache bins, GC-able queues). */
export interface GarbageCollectable {
  garbageCollection(): void;
}

/**
 * Collaborators for `hook_cron`. In Drupal these come from the container
 * (`Cache::getBins()`, the queue worker manager + queue factory, flood, etc.);
 * here they are injected so the hook stays pure and testable.
 */
export interface SystemCronContext {
  /** All cache bins to garbage-collect (Cache::getBins()). */
  cacheBins?: GarbageCollectable[];
  /** Queues whose workers implement QueueGarbageCollectionInterface. */
  queues?: GarbageCollectable[];
}

/**
 * Implements hook_cron(): runs garbage collection across cache bins and queues.
 *
 * The PHP original also flushes flood, the expirable key-value store, ensures
 * .htaccess files, fetches security advisories and purges deleted field data —
 * those depend on services not yet ported and are intentionally omitted.
 */
export function systemCron(context: SystemCronContext = {}): void {
  for (const bin of context.cacheBins ?? []) {
    bin.garbageCollection();
  }
  for (const queue of context.queues ?? []) {
    queue.garbageCollection();
  }
}

/**
 * Implements hook_help(): returns help markup for a route, or null when the
 * system module has no help for it (faithful to the PHP `?string` return).
 */
export function systemHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.system':
      return (
        '<h2>About</h2><p>The System module is integral to the site: it provides ' +
        'user interfaces for many core systems and settings, as well as the basic ' +
        'administrative menu structure.</p>'
      );
    case 'system.admin_index':
      return '<p>This page shows you all available administration tasks for each module.</p>';
    default:
      return null;
  }
}

/**
 * Registers the system module's hook implementations on a ModuleHandler.
 *
 * Pass a {@link SystemCronContext} to wire the cron hook's collaborators; the
 * registered cron closure forwards the hook arguments to {@link systemCron}.
 */
export function registerSystemHooks(
  handler: ModuleHandlerInterface,
  cronContext: SystemCronContext = {},
): void {
  handler.implement('system', 'cron', () => systemCron(cronContext));
  handler.implement('system', 'help', (routeName: unknown) =>
    systemHelp(routeName as string),
  );
}
