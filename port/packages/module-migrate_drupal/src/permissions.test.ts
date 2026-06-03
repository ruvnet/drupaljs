import { describe, it, expect } from 'vitest';
import {
  migrateDrupalPermissions,
  migrateDrupalRoutes,
  MIGRATE_DRUPAL_MODULE,
} from './index.js';

describe('migrate_drupal module metadata', () => {
  it('declares its machine name and migrate dependency', () => {
    expect(MIGRATE_DRUPAL_MODULE.name).toBe('migrate_drupal');
    expect(MIGRATE_DRUPAL_MODULE.dependencies).toContain('migrate');
  });
});

describe('migrateDrupalPermissions', () => {
  it('exposes no module-defined permissions (framework module)', () => {
    // migrate_drupal ships no *.permissions.yml; access is governed by the
    // migrate UI module. The map exists for parity but is empty.
    expect(migrateDrupalPermissions()).toEqual({});
  });
});

describe('migrateDrupalRoutes', () => {
  it('provides the help page route', () => {
    const routes = migrateDrupalRoutes();
    const route = routes['help.page.migrate_drupal'];
    expect(route).toBeDefined();
    expect(route?.path).toContain('migrate_drupal');
  });
});
