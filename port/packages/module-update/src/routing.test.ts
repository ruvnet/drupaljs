import { describe, it, expect } from 'vitest';
import { updateRoutes } from './routing.js';

describe('updateRoutes', () => {
  it('defines the three update report routes', () => {
    expect(Object.keys(updateRoutes).sort()).toEqual([
      'update.manual_status',
      'update.settings',
      'update.status',
    ]);
  });

  it('maps the status report to its controller', () => {
    expect(updateRoutes['update.status']?.path).toBe('/admin/reports/updates');
    expect(updateRoutes['update.status']?.defaults?._controller).toContain(
      'UpdateController::updateStatus',
    );
  });

  it('guards the manual check with a CSRF token', () => {
    expect(updateRoutes['update.manual_status']?.requirements?._csrf_token).toBe(
      'TRUE',
    );
  });

  it('requires the site-configuration permission on every route', () => {
    for (const route of Object.values(updateRoutes)) {
      expect(route.requirements?._permission).toBe('administer site configuration');
    }
  });
});
