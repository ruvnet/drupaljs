/**
 * System module routes — TypeScript port of a representative slice of
 * `core/modules/system/system.routing.yml`.
 *
 * Each entry constructs a `@drupaljs/routing` {@link Route} with the same path,
 * `defaults` (`_controller` / `_form` / `_title`), `requirements`
 * (`_permission` / `_access_*`) and `options` (`no_cache`) as the YAML. The
 * controller/form class strings are preserved verbatim (Drupal-style FQCNs)
 * since the actual TS controllers live in other packages.
 *
 * Only a faithful vertical slice is ported (cron, core settings forms,
 * maintenance mode, run-cron). The remaining routes follow the same shape.
 */
import { Route } from '@drupaljs/routing';

export const systemRoutes: Readonly<Record<string, Route>> = {
  'system.cron': new Route(
    '/cron/{key}',
    { _controller: '\\Drupal\\system\\CronController::run' },
    { _access_system_cron: 'TRUE' },
    { no_cache: true },
  ),
  'system.run_cron': new Route(
    '/admin/reports/status/run-cron',
    { _controller: '\\Drupal\\system\\CronController::runManually' },
    { _permission: 'administer site configuration' },
    { no_cache: true },
  ),
  'system.site_information_settings': new Route(
    '/admin/config/system/site-information',
    { _form: '\\Drupal\\system\\Form\\SiteInformationForm', _title: 'Basic site settings' },
    { _permission: 'administer site configuration' },
  ),
  'system.cron_settings': new Route(
    '/admin/config/system/cron',
    { _form: '\\Drupal\\system\\Form\\CronForm', _title: 'Cron' },
    { _permission: 'administer site configuration' },
  ),
  'system.logging_settings': new Route(
    '/admin/config/development/logging',
    { _form: '\\Drupal\\system\\Form\\LoggingForm', _title: 'Logging and errors' },
    { _permission: 'administer site configuration' },
  ),
  'system.file_system_settings': new Route(
    '/admin/config/media/file-system',
    { _form: '\\Drupal\\system\\Form\\FileSystemForm', _title: 'File system' },
    { _permission: 'administer site configuration' },
  ),
  'system.regional_settings': new Route(
    '/admin/config/regional/settings',
    { _form: '\\Drupal\\system\\Form\\RegionalForm', _title: 'Regional settings' },
    { _permission: 'administer site configuration' },
  ),
  'system.site_maintenance_mode': new Route(
    '/admin/config/development/maintenance',
    {
      _form: '\\Drupal\\system\\Form\\SiteMaintenanceModeForm',
      _title: 'Maintenance mode',
    },
    {
      _permission: 'administer site configuration+administer software updates',
    },
  ),
};
