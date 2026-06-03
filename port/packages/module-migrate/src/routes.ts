/**
 * Port of `migrate.routing.yml`.
 *
 * The migration-messages overview + detail routes. The `_controller` /
 * `_title_callback` targets reference the MigrateMessageController, which is not
 * ported here; their original string ids are preserved so the route shape
 * round-trips. Wire them up when that controller lands.
 */

import type { RouteCollection } from './contracts.js';

export function migrateRoutes(): RouteCollection {
  return {
    'migrate.messages': {
      path: '/admin/reports/migration-messages',
      defaults: {
        _controller: 'MigrateMessageController::overview',
        _title: 'Migration messages',
      },
      requirements: { _permission: 'view migration messages' },
    },
    'migrate.messages.detail': {
      path: '/admin/reports/migration-messages/{migration_id}',
      defaults: {
        _controller: 'MigrateMessageController::details',
        _title_callback: 'MigrateMessageController::title',
      },
      requirements: { _permission: 'view migration messages' },
    },
  };
}
