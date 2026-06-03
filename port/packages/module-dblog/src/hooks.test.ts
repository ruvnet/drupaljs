import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { dblogCron, dblogHelp, dblogViewsPreRender, registerDblogHooks } from './hooks.js';
import { InMemoryWatchdogStore } from './watchdog-store.js';
import { RfcLogLevel, type WatchdogInsert } from './types.js';

function row(): WatchdogInsert {
  return {
    uid: 0,
    type: 'system',
    message: 'm',
    variables: 'null',
    severity: RfcLogLevel.NOTICE,
    link: null,
    location: '/',
    referer: null,
    hostname: '127.0.0.1',
    timestamp: 1,
  };
}

describe('dblog hook_cron', () => {
  it('prunes the watchdog table to the configured row_limit', () => {
    const store = new InMemoryWatchdogStore();
    for (let i = 0; i < 6; i++) store.insert(row());
    dblogCron(store, { row_limit: 2 });
    expect(store.count()).toBe(2);
  });

  it('keeps all rows when row_limit is 0', () => {
    const store = new InMemoryWatchdogStore();
    for (let i = 0; i < 3; i++) store.insert(row());
    dblogCron(store, { row_limit: 0 });
    expect(store.count()).toBe(3);
  });
});

describe('dblog hook_help', () => {
  it('returns help markup for help.page.dblog and dblog.overview', () => {
    expect(dblogHelp('help.page.dblog')).toContain('Database Logging module');
    expect(dblogHelp('dblog.overview')).toContain('Monitor your site');
  });

  it('returns null for unknown routes', () => {
    expect(dblogHelp('some.other.route')).toBeNull();
  });
});

describe('dblog hook_views_pre_render', () => {
  it('attaches the dblog library when the view base table is watchdog', () => {
    const view = { storage: { base_table: 'watchdog' }, element: {} as Record<string, unknown> };
    dblogViewsPreRender(view);
    expect(view.element['#attached']).toEqual({ library: ['dblog/drupal.dblog'] });
  });

  it('does nothing for non-watchdog views', () => {
    const view = { storage: { base_table: 'node' }, element: {} as Record<string, unknown> };
    dblogViewsPreRender(view);
    expect(view.element['#attached']).toBeUndefined();
  });
});

describe('registerDblogHooks', () => {
  it('registers cron/help/views_pre_render on a ModuleHandler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ dblog: { name: 'dblog' } });
    const store = new InMemoryWatchdogStore();
    for (let i = 0; i < 4; i++) store.insert(row());
    registerDblogHooks(handler, { store, settings: { row_limit: 1 } });

    expect(handler.hasImplementations('cron', 'dblog')).toBe(true);
    expect(handler.hasImplementations('help', 'dblog')).toBe(true);
    expect(handler.hasImplementations('views_pre_render', 'dblog')).toBe(true);

    handler.invoke('dblog', 'cron');
    expect(store.count()).toBe(1);
    expect(handler.invoke('dblog', 'help', ['help.page.dblog'])).toContain('Database Logging');
  });
});
