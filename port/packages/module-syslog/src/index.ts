/**
 * @drupaljs/module-syslog — TypeScript port of Drupal core's `syslog` module
 * (core/modules/syslog).
 *
 * "Logs events to the web server's system log." This vertical slice ports:
 *  - The `logger.syslog` service: {@link SysLog} (Drupal\syslog\Logger\SysLog),
 *    registered as a PSR-3 logger that formats entries and writes them to the
 *    OS syslog facility.
 *  - Hook implementations (Drupal\syslog\Hook\SyslogHooks): {@link syslogHelp}
 *    (hook_help) and {@link formSystemLoggingSettingsAlter}
 *    (hook_form_system_logging_settings_alter), registered via @drupaljs/hook's
 *    explicit `implement()` API through {@link registerSyslogHooks}.
 *  - Module config: {@link SYSLOG_SETTINGS_DEFAULT} / {@link SYSLOG_SETTINGS_SCHEMA}
 *    and the {@link facilityList} of UNIX syslog facilities.
 *
 * The syslog module defines no entity types, plugins, permissions, or routes of
 * its own — its `configure` route reuses `system.logging_settings`, which it
 * augments via the form-alter hook above.
 */

export { SysLog, strtr } from './logger/syslog.js';
export type { SysLogOptions } from './logger/syslog.js';

export {
  syslogHelp,
  formSystemLoggingSettingsAlter,
  registerSyslogHooks,
} from './hooks.js';
export type { ModuleExistsChecker, HookRegistrar } from './hooks.js';

export {
  SYSLOG_SETTINGS_DEFAULT,
  SYSLOG_SETTINGS_SCHEMA,
  SYSLOG_FACILITY_VALUES,
  facilityList,
} from './config.js';

export { RfcLogLevel } from './types.js';
export type {
  ConfigInterface,
  ConfigFactoryInterface,
  LogMessageParserInterface,
  RfcLogLevelValue,
  SyslogContext,
  SyslogSettings,
} from './types.js';
