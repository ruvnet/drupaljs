import { describe, it, expect, vi } from 'vitest';
import { syslogHelp, formSystemLoggingSettingsAlter, registerSyslogHooks } from './hooks.js';

/** Minimal module-handler double exposing the surface the hooks use. */
function makeHandler(modules: Record<string, true> = {}) {
  return {
    moduleExists: vi.fn((m: string) => m in modules),
    implement: vi.fn(),
  };
}

describe('syslogHelp (hook_help)', () => {
  it('returns markup mentioning Syslog for help.page.syslog', () => {
    const out = syslogHelp('help.page.syslog');
    expect(out).not.toBeNull();
    expect(out).toContain('Syslog module');
    expect(out).toContain('<h2>');
  });

  it('returns null for unrelated routes', () => {
    expect(syslogHelp('node.add')).toBeNull();
  });
});

describe('formSystemLoggingSettingsAlter (hook_form_FORM_ID_alter)', () => {
  it('adds identity, facility and format fields targeting syslog.settings', () => {
    const handler = makeHandler();
    const form: Record<string, any> = {};

    formSystemLoggingSettingsAlter(form, handler);

    expect(form.syslog_identity['#type']).toBe('textfield');
    expect(form.syslog_identity['#config_target']).toBe('syslog.settings:identity');

    expect(form.syslog_facility['#type']).toBe('select');
    expect(form.syslog_facility['#config_target']).toBe('syslog.settings:facility');
    // Facility options come from the facility list (LOG_LOCAL0..7).
    expect(form.syslog_facility['#options'][16]).toBe('LOG_LOCAL0');
    expect(Object.keys(form.syslog_facility['#options'])).toHaveLength(8);

    expect(form.syslog_format['#type']).toBe('textarea');
    expect(form.syslog_format['#required']).toBe(true);
    expect(form.syslog_format['#config_target']).toBe('syslog.settings:format');
  });

  it('omits the "More information" link description suffix when help is disabled', () => {
    const handler = makeHandler(); // help not installed
    const form: Record<string, any> = {};

    formSystemLoggingSettingsAlter(form, handler);

    expect(form.syslog_identity['#description']).not.toContain('More information');
  });

  it('appends a help link to descriptions when the help module exists', () => {
    const handler = makeHandler({ help: true });
    const form: Record<string, any> = {};

    formSystemLoggingSettingsAlter(form, handler);

    expect(form.syslog_identity['#description']).toContain('More information');
  });
});

describe('registerSyslogHooks', () => {
  it('registers help and form-alter hooks on the module handler', () => {
    const handler = makeHandler();

    registerSyslogHooks(handler);

    const hooks = handler.implement.mock.calls.map((c) => c[1]);
    expect(handler.implement.mock.calls.every((c) => c[0] === 'syslog')).toBe(true);
    expect(hooks).toContain('help');
    expect(hooks).toContain('form_system_logging_settings_alter');
  });

  it('wires the registered help hook to syslogHelp', () => {
    const handler = makeHandler();
    registerSyslogHooks(handler);

    const helpCall = handler.implement.mock.calls.find((c) => c[1] === 'help')!;
    const callback = helpCall[2] as (route: string) => string | null;
    expect(callback('help.page.syslog')).toContain('Syslog module');
  });
});
