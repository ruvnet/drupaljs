import { describe, it, expect } from 'vitest';
import {
  SYSLOG_SETTINGS_DEFAULT,
  SYSLOG_SETTINGS_SCHEMA,
  SYSLOG_FACILITY_VALUES,
  facilityList,
} from './config.js';

describe('syslog config defaults', () => {
  it('matches config/install/syslog.settings.yml', () => {
    expect(SYSLOG_SETTINGS_DEFAULT).toEqual({
      identity: 'drupal',
      facility: 8,
      format: '!base_url|!timestamp|!type|!ip|!request_uri|!referer|!uid|!link|!message',
    });
  });

  it('exposes the syslog.settings schema mapping', () => {
    const schema = SYSLOG_SETTINGS_SCHEMA['syslog.settings'];
    expect(schema.type).toBe('config_object');
    expect(Object.keys(schema.mapping)).toEqual(['identity', 'facility', 'format']);
    expect(schema.mapping.facility.type).toBe('integer');
  });
});

describe('facilityList', () => {
  it('lists the eight LOG_LOCAL facilities keyed by numeric code', () => {
    const list = facilityList();
    expect(Object.keys(list)).toHaveLength(8);
    expect(list[SYSLOG_FACILITY_VALUES.LOG_LOCAL0]).toBe('LOG_LOCAL0');
    expect(list[SYSLOG_FACILITY_VALUES.LOG_LOCAL7]).toBe('LOG_LOCAL7');
  });
});
