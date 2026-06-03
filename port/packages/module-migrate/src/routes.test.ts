import { describe, it, expect } from 'vitest';
import { migrateRoutes } from './routes.js';

describe('migrateRoutes', () => {
  it('ports the migration-messages overview and detail routes', () => {
    const routes = migrateRoutes();
    expect(routes['migrate.messages']).toMatchObject({
      path: '/admin/reports/migration-messages',
      requirements: { _permission: 'view migration messages' },
    });
    const detail = routes['migrate.messages.detail']!;
    expect(detail.path).toBe('/admin/reports/migration-messages/{migration_id}');
    expect(detail.requirements).toEqual({
      _permission: 'view migration messages',
    });
  });
});
