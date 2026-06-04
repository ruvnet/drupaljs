/**
 * @drupaljs/module-dblog — TypeScript port of Drupal core's `dblog` module.
 *
 * Faithful, minimal vertical slice of drupal-core/core/modules/dblog:
 *  - {@link RfcLogLevel} severities + {@link WatchdogEntry} schema (dblog.install)
 *  - {@link DbLog} logger writing to the `watchdog` table (src/Logger/DbLog.php)
 *  - {@link DbLogFilters} overview filters (src/DbLogFilters.php)
 *  - {@link formatMessage} from the controller (src/Controller/DbLogController.php)
 *  - hook implementations registered via @drupaljs/hook ({@link registerDblogHooks})
 *  - {@link dblogRoutes} route definitions (dblog.routing.yml)
 *
 * Deep external collaborators (the real Database\Connection, Views, render
 * system, full Xss filter, translation) are stubbed with local types/minimal
 * implementations marked TODO.
 */

// Contracts & constants
export {
  RfcLogLevel,
  RFC_LOG_LEVELS,
  passthroughTranslator,
  type WatchdogEntry,
  type WatchdogInsert,
  type WatchdogStore,
  type LogContext,
  type Translator,
} from './types.js';

// Storage
export { InMemoryWatchdogStore } from './watchdog-store.js';

// Logger
export { DbLog, type DedicatedStoreFactory } from './logger.js';

// Message placeholder parsing
export {
  parseMessagePlaceholders,
  parseLogContextPlaceholders,
} from './message-parser.js';

// Filters service
export {
  DbLogFilters,
  type DbLogFilter,
  type DbLogFilterSet,
} from './dblog-filters.js';

// Controller (message formatting)
export { formatMessage } from './controller.js';

// Admin XSS filtering (local stub)
export { filterAdmin } from './xss.js';

// Hooks
export {
  dblogCron,
  dblogHelp,
  dblogViewsPreRender,
  registerDblogHooks,
  DEFAULT_DBLOG_SETTINGS,
  type DblogSettings,
  type DblogHookContext,
  type ViewLike,
} from './hooks.js';

// Help text
export { dblogHelpText } from './help.js';

// Routes
export { dblogRoutes } from './routes.js';
