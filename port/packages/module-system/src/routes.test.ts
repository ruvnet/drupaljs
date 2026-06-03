import { describe, it, expect } from 'vitest';
import { systemRoutes } from './routes.js';

describe('systemRoutes', () => {
  it('ports system.cron with its key parameter and access requirement', () => {
    const route = systemRoutes['system.cron'];
    expect(route).toBeDefined();
    expect(route!.getPath()).toBe('/cron/{key}');
    expect(route!.getDefaults()['_controller']).toBe('\\Drupal\\system\\CronController::run');
    expect(route!.getRequirements()['_access_system_cron']).toBe('TRUE');
    expect(route!.getOptions()['no_cache']).toBe(true);
  });

  it('ports the site information settings form route with its permission', () => {
    const route = systemRoutes['system.site_information_settings'];
    expect(route!.getPath()).toBe('/admin/config/system/site-information');
    expect(route!.getDefaults()['_form']).toBe('\\Drupal\\system\\Form\\SiteInformationForm');
    expect(route!.getRequirements()['_permission']).toBe('administer site configuration');
  });

  it('ports the maintenance-mode route requiring two permissions (AND)', () => {
    const route = systemRoutes['system.site_maintenance_mode'];
    expect(route!.getRequirements()['_permission']).toBe(
      'administer site configuration+administer software updates',
    );
  });

  it('exposes the cron-settings and run-cron routes', () => {
    expect(systemRoutes['system.cron_settings']?.getPath()).toBe('/admin/config/system/cron');
    const runCron = systemRoutes['system.run_cron'];
    expect(runCron?.getPath()).toBe('/admin/reports/status/run-cron');
    expect(runCron?.getDefaults()['_controller']).toBe(
      '\\Drupal\\system\\CronController::runManually',
    );
  });
});
