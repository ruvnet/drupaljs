/**
 * Syslog module hook implementations — TypeScript port of
 * core/modules/syslog/src/Hook/SyslogHooks.php.
 *
 * Drupal 11 declares hooks with `#[Hook('name')]` attributes discovered by the
 * ModuleHandler. The TS port has no PHP scanning, so plain functions are exposed
 * plus {@link registerSyslogHooks}, which registers them on a `@drupaljs/hook`
 * ModuleHandler via its explicit `implement()` API (the TS-idiomatic equivalent
 * of attribute discovery — see @drupaljs/hook docs).
 *
 * Ported hooks: `hook_help` and `hook_form_system_logging_settings_alter`.
 */
import { facilityList } from './config.js';

/**
 * Minimal module-handler surface the form-alter hook depends on
 * (ModuleHandlerInterface::moduleExists). Kept structural so a full
 * `@drupaljs/hook` ModuleHandler — or a test double — both satisfy it.
 */
export interface ModuleExistsChecker {
  moduleExists(module: string): boolean;
}

/** The subset of ModuleHandlerInterface used to register hooks. */
export interface HookRegistrar {
  implement(module: string, hook: string, callback: (...args: any[]) => unknown): void;
}

/**
 * Implements hook_help(): returns help markup for a route, or null when syslog
 * has no help for it (faithful to the PHP `?string` return).
 * Port of SyslogHooks::help().
 */
export function syslogHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.syslog': {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Syslog module logs events by sending messages to the logging facility of ' +
        "your web server's operating system. Syslog is an operating system administrative " +
        'logging tool that provides valuable information for use in system management and ' +
        'security auditing. Most suited to medium and large sites, Syslog provides filtering ' +
        'tools that allow messages to be routed by type and severity. For more information, ' +
        'see the <a href="https://www.drupal.org/documentation/modules/syslog">online ' +
        'documentation for the Syslog module</a>, as well as PHP\'s documentation pages for ' +
        'the <a href="http://php.net/manual/function.openlog.php">openlog</a> and ' +
        '<a href="http://php.net/manual/function.syslog.php">syslog</a> functions.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Logging for UNIX, Linux, and Mac OS X</dt>';
      output +=
        '<dd>On UNIX, Linux, and Mac OS X, you will find the configuration in the file ' +
        '<em>/etc/syslog.conf</em>, or in <em>/etc/rsyslog.conf</em> or in the directory ' +
        '<em>/etc/rsyslog.d</em>. These files define the routing configuration. Messages can ' +
        'be flagged with the codes <code>LOG_LOCAL0</code> through <code>LOG_LOCAL7</code>.</dd>';
      output += '<dt>Logging for Microsoft Windows</dt>';
      output +=
        '<dd>On Microsoft Windows, messages are always sent to the Event Log using the code ' +
        '<code>LOG_USER</code>.</dd>';
      output += '</dl>';
      return output;
    }
    default:
      return null;
  }
}

/**
 * Implements hook_form_FORM_ID_alter() for system_logging_settings: adds the
 * Syslog identity / facility / format fields, each bound to `syslog.settings`
 * via `#config_target`. Mutates `form` in place (Drupal alter-by-reference).
 * Port of SyslogHooks::formSystemLoggingSettingsAlter().
 *
 * @param form          The render-array form being altered (mutated in place).
 * @param moduleHandler Used to detect whether the help module is installed.
 */
export function formSystemLoggingSettingsAlter(
  form: Record<string, any>,
  moduleHandler: ModuleExistsChecker,
): void {
  // In PHP this is a localized link to help.page; here a plain marker suffices
  // for the vertical slice. TODO(@drupaljs/link): build a real Link/Url once the
  // routing+link packages are wired into this module.
  const help = moduleHandler.moduleExists('help') ? ' More information.' : '';

  form.syslog_identity = {
    '#type': 'textfield',
    '#title': 'Syslog identity',
    '#config_target': 'syslog.settings:identity',
    '#description':
      'A string that will be prepended to every message logged to Syslog. If you have ' +
      'multiple sites logging to the same Syslog log file, a unique identity per site makes ' +
      'it easy to tell the log entries apart.' +
      help,
  };

  // PHP gates the facility field on `defined('LOG_LOCAL0')` (UNIX only). The
  // facility codes are always known in the port, so the field is always offered.
  form.syslog_facility = {
    '#type': 'select',
    '#title': 'Syslog facility',
    '#config_target': 'syslog.settings:facility',
    '#options': facilityList(),
    '#description':
      'Depending on the system configuration, Syslog and other logging tools use this code ' +
      'to identify or filter messages from within the entire system log.' +
      help,
  };

  form.syslog_format = {
    '#type': 'textarea',
    '#title': 'Syslog format',
    '#required': true,
    '#config_target': 'syslog.settings:format',
    '#description':
      'Specify the format of the syslog entry. Available variables are: !base_url, ' +
      '!timestamp, !type, !ip, !request_uri, !referer, !severity, !uid, !link, !message.',
  };
}

/**
 * Registers the syslog module's hook implementations on a ModuleHandler.
 * The form-alter closure receives the form (and any context) by reference.
 */
export function registerSyslogHooks(
  handler: HookRegistrar & ModuleExistsChecker,
): void {
  handler.implement('syslog', 'help', (routeName: unknown) =>
    syslogHelp(routeName as string),
  );
  handler.implement(
    'syslog',
    'form_system_logging_settings_alter',
    (form: unknown) => formSystemLoggingSettingsAlter(form as Record<string, any>, handler),
  );
}
