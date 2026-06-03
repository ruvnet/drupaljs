/**
 * Default configuration + schema for the syslog module.
 * Port of core/modules/syslog/config/install/syslog.settings.yml and
 * config/schema/syslog.schema.yml.
 */
import type { SyslogSettings } from './types.js';

/**
 * Default `syslog.settings` (config/install/syslog.settings.yml).
 *
 * `facility: 8` is LOG_USER. In Drupal this is overwritten during
 * `syslog_install()` based on the OS; that install hook is out of scope for this
 * slice (no PHP install pipeline in the port).
 */
export const SYSLOG_SETTINGS_DEFAULT: SyslogSettings = {
  identity: 'drupal',
  facility: 8,
  format: '!base_url|!timestamp|!type|!ip|!request_uri|!referer|!uid|!link|!message',
};

/**
 * Config schema metadata for `syslog.settings`
 * (config/schema/syslog.schema.yml).
 */
export const SYSLOG_SETTINGS_SCHEMA = {
  'syslog.settings': {
    type: 'config_object',
    label: 'Syslog settings',
    mapping: {
      identity: { type: 'string', label: 'Identity' },
      facility: { type: 'integer', label: 'Facility' },
      format: { type: 'string', label: 'Format' },
    },
  },
} as const;

/**
 * UNIX/Linux syslog facilities (LOG_LOCAL0..LOG_LOCAL7).
 *
 * Port of SyslogHooks::facilityList() / syslog_facility_list(). PHP exposes the
 * numeric `LOG_LOCAL*` constants as keys; their conventional values are 16, 17,
 * …, 23. Node's stdlib has no `LOG_LOCAL*` constants, so the mapping is encoded
 * explicitly here.
 */
export const SYSLOG_FACILITY_VALUES = {
  LOG_LOCAL0: 16,
  LOG_LOCAL1: 17,
  LOG_LOCAL2: 18,
  LOG_LOCAL3: 19,
  LOG_LOCAL4: 20,
  LOG_LOCAL5: 21,
  LOG_LOCAL6: 22,
  LOG_LOCAL7: 23,
} as const;

/**
 * Lists all possible syslog facilities for UNIX/Linux, keyed by numeric code.
 * Port of SyslogHooks::facilityList().
 */
export function facilityList(): Record<number, string> {
  const list: Record<number, string> = {};
  for (const [name, value] of Object.entries(SYSLOG_FACILITY_VALUES)) {
    list[value] = name;
  }
  return list;
}
