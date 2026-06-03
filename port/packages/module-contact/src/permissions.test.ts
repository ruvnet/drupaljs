import { describe, it, expect } from 'vitest';
import {
  ContactPermission,
  contactPermissions,
  type ContactPermissionName,
} from './permissions.js';

describe('contact permissions', () => {
  it('defines exactly the three contact.permissions.yml entries', () => {
    expect(Object.keys(contactPermissions).sort()).toEqual(
      [
        'access site-wide contact form',
        'access user contact forms',
        'administer contact forms',
      ].sort(),
    );
  });

  it('ports each permission title verbatim from the YAML', () => {
    expect(contactPermissions[ContactPermission.AdministerContactForms].title).toBe(
      'Administer contact forms and contact form settings',
    );
    expect(contactPermissions[ContactPermission.AccessSiteWideContactForm].title).toBe(
      'Use the site-wide contact form',
    );
    expect(contactPermissions[ContactPermission.AccessUserContactForms].title).toBe(
      "Use users' personal contact forms",
    );
  });

  it('marks no contact permission as restricted (YAML has no restrict access)', () => {
    for (const def of Object.values(contactPermissions)) {
      expect(def.restrictAccess).toBeUndefined();
    }
  });

  it('exposes machine names as a typed const map', () => {
    const name: ContactPermissionName = ContactPermission.AdministerContactForms;
    expect(name).toBe('administer contact forms');
  });
});
