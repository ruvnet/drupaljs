import { describe, it, expect } from 'vitest';
import { systemPermissions, type Permission } from './permissions.js';

describe('systemPermissions', () => {
  it('ports the system.permissions.yml entries', () => {
    // A representative sample faithful to drupal-core system.permissions.yml.
    expect(systemPermissions['administer modules']).toEqual<Permission>({
      title: 'Administer modules',
    });
    expect(systemPermissions['administer site configuration']).toEqual<Permission>({
      title: 'Administer site configuration',
      restrict_access: true,
    });
    expect(systemPermissions['administer actions']).toEqual<Permission>({
      title: 'Administer actions',
      restrict_access: true,
    });
  });

  it('carries descriptions where Drupal defines them', () => {
    expect(systemPermissions['link to any page']?.description).toContain(
      'bypass access checking',
    );
  });

  it('defines the core administration permissions', () => {
    const ids = Object.keys(systemPermissions);
    for (const id of [
      'access administration pages',
      'access content',
      'access site reports',
      'administer menu',
      'view the administration theme',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('marks restricted permissions and leaves unrestricted ones unflagged', () => {
    expect(systemPermissions['administer themes']?.restrict_access).toBe(true);
    expect(systemPermissions['access content']?.restrict_access).toBeUndefined();
  });
});
