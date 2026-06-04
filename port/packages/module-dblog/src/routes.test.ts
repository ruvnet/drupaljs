import { describe, it, expect } from 'vitest';
import { Route } from '@drupaljs/routing';
import { dblogRoutes } from './routes.js';

describe('dblogRoutes', () => {
  it('defines the overview/confirm/event/top routes from dblog.routing.yml', () => {
    expect(Object.keys(dblogRoutes).sort()).toEqual([
      'dblog.access_denied',
      'dblog.confirm',
      'dblog.event',
      'dblog.overview',
      'dblog.page_not_found',
      'dblog.search',
    ]);
  });

  it('overview is a Route at /admin/reports/dblog guarded by "access site reports"', () => {
    const r = dblogRoutes['dblog.overview']!;
    expect(r).toBeInstanceOf(Route);
    expect(r.getPath()).toBe('/admin/reports/dblog');
    expect(r.getRequirement('_permission')).toBe('access site reports');
  });

  it('event route carries the {event_id} param and the controller default', () => {
    const r = dblogRoutes['dblog.event']!;
    expect(r.getPath()).toBe('/admin/reports/dblog/event/{event_id}');
    expect(r.getDefault('_controller')).toContain('DbLogController::eventDetails');
  });

  it('top-error routes pin their type default', () => {
    expect(dblogRoutes['dblog.page_not_found']!.getDefault('type')).toBe('page not found');
    expect(dblogRoutes['dblog.access_denied']!.getDefault('type')).toBe('access denied');
    expect(dblogRoutes['dblog.search']!.getDefault('type')).toBe('search');
  });
});
