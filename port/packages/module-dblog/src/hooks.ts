/**
 * dblog module hook implementations — TypeScript port of a slice of
 * `core/modules/dblog/src/Hook/DblogHooks.php`.
 *
 * Drupal 11 declares hooks with `#[Hook('name')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so we expose plain functions
 * plus {@link registerDblogHooks}, which registers them on a `@drupaljs/hook`
 * ModuleHandler via its explicit `implement()` API.
 *
 * Ported hooks: `hook_cron` (prune watchdog to row_limit), `hook_help`, and
 * `hook_views_pre_render` (attach the dblog library to watchdog-based views).
 */
import type { ModuleHandlerInterface } from '@drupaljs/hook';
import type { WatchdogStore } from './types.js';
import { dblogHelpText } from './help.js';

/** dblog.settings config (config/install/dblog.settings.yml). */
export interface DblogSettings {
  /** Maximum number of messages to keep; 0 = keep all. */
  readonly row_limit: number;
}

/** Default dblog settings — mirrors config/install/dblog.settings.yml. */
export const DEFAULT_DBLOG_SETTINGS: DblogSettings = { row_limit: 1000 };

/**
 * Implements hook_cron(): pares the watchdog table to `row_limit` messages.
 * Ports DblogHooks::cron().
 */
export function dblogCron(store: WatchdogStore, settings: DblogSettings): void {
  store.pruneToRowLimit(settings.row_limit);
}

/**
 * Implements hook_help(): returns help markup for a route, or null.
 * Ports DblogHooks::help().
 */
export function dblogHelp(routeName: string): string | null {
  return dblogHelpText(routeName);
}

/** Minimal shape of a Views view as seen by hook_views_pre_render. */
export interface ViewLike {
  storage: { base_table?: string; get?: (key: string) => unknown };
  element: Record<string, unknown> & {
    '#attached'?: { library?: string[] };
  };
}

/**
 * Implements hook_views_pre_render(): attaches the dblog library to any view
 * whose base table is `watchdog`. Ports DblogHooks::viewsPreRender().
 */
export function dblogViewsPreRender(view: ViewLike): void {
  const baseTable = view.storage.base_table ?? view.storage.get?.('base_table');
  if (baseTable === 'watchdog') {
    const attached = (view.element['#attached'] ??= {});
    (attached.library ??= []).push('dblog/drupal.dblog');
  }
}

/** Collaborators required to wire the dblog hooks onto a ModuleHandler. */
export interface DblogHookContext {
  readonly store: WatchdogStore;
  readonly settings: DblogSettings;
}

/**
 * Registers the dblog module's hook implementations on a ModuleHandler.
 */
export function registerDblogHooks(
  handler: ModuleHandlerInterface,
  context: DblogHookContext,
): void {
  handler.implement('dblog', 'cron', () => dblogCron(context.store, context.settings));
  handler.implement('dblog', 'help', (routeName: unknown) => dblogHelp(routeName as string));
  handler.implement('dblog', 'views_pre_render', (view: unknown) =>
    dblogViewsPreRender(view as ViewLike),
  );
}
