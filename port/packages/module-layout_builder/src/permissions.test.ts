import { describe, it, expect } from 'vitest';
import {
  STATIC_PERMISSIONS,
  overridesPermissions,
  allPermissions,
  type OverridableDisplay,
} from './permissions.js';

describe('layout_builder permissions', () => {
  it('ports the static permissions from permissions.yml', () => {
    expect(STATIC_PERMISSIONS['configure any layout']).toMatchObject({
      title: 'Configure any layout',
      restrictAccess: true,
    });
    expect(STATIC_PERMISSIONS['create and edit custom blocks']).toMatchObject({
      title: 'Create and edit content blocks',
    });
  });

  it('derives two override permissions per overridable display', () => {
    const displays: OverridableDisplay[] = [
      {
        entityTypeId: 'node',
        bundle: 'article',
        hasBundleKey: true,
        entityTypeLabel: 'Content',
        bundleLabel: 'Article',
      },
    ];
    const perms = overridesPermissions(displays);
    expect(Object.keys(perms)).toEqual([
      'configure all article node layout overrides',
      'configure editable article node layout overrides',
    ]);
    expect(perms['configure all article node layout overrides']!.title).toBe(
      'Content - Article: Configure all layout overrides',
    );
    expect(perms['configure all article node layout overrides']!.warning).toMatch(/Warning:/);
  });

  it('omits the bundle label when the entity type has no bundle key', () => {
    const perms = overridesPermissions([
      {
        entityTypeId: 'user',
        bundle: 'user',
        hasBundleKey: false,
        entityTypeLabel: 'Users',
        bundleLabel: 'User',
      },
    ]);
    expect(perms['configure all user user layout overrides']!.title).toBe(
      'Users: Configure all layout overrides',
    );
  });

  it('allPermissions merges static and derived permissions', () => {
    const perms = allPermissions([
      {
        entityTypeId: 'node',
        bundle: 'page',
        hasBundleKey: true,
        entityTypeLabel: 'Content',
        bundleLabel: 'Page',
      },
    ]);
    expect(perms['configure any layout']).toBeDefined();
    expect(perms['configure all page node layout overrides']).toBeDefined();
  });

  it('allPermissions defaults to only static permissions', () => {
    expect(Object.keys(allPermissions())).toEqual(Object.keys(STATIC_PERMISSIONS));
  });
});
