import { describe, it, expect } from 'vitest';
import { migratePermissions } from './permissions.js';

describe('migratePermissions', () => {
  it('declares the view-migration-messages permission (migrate.permissions.yml)', () => {
    const perms = migratePermissions();
    expect(perms['view migration messages']).toEqual({ title: 'View migration messages' });
  });
});
