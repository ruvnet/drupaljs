import { describe, it, expect } from 'vitest';
import { contactRoutes } from './routing.js';

describe('contact routes', () => {
  it('ports all seven routes from contact.routing.yml', () => {
    expect(Object.keys(contactRoutes).sort()).toEqual(
      [
        'entity.contact_form.delete_form',
        'entity.contact_form.collection',
        'contact.form_add',
        'entity.contact_form.edit_form',
        'contact.site_page',
        'entity.contact_form.canonical',
        'entity.user.contact_form',
      ].sort(),
    );
  });

  it('maps the site page to the controller with a nullable contact_form default', () => {
    const route = contactRoutes['contact.site_page']!;
    expect(route.path).toBe('/contact');
    expect(route.controller).toContain('contactSitePage');
    expect(route.defaults).toEqual({ contact_form: null });
    expect(route.requirements.permission).toBe('access site-wide contact form');
  });

  it('guards the canonical contact form route by entity view access', () => {
    const route = contactRoutes['entity.contact_form.canonical']!;
    expect(route.path).toBe('/contact/{contact_form}');
    expect(route.requirements.entityAccess).toBe('contact_form.view');
  });

  it('guards the personal contact tab with the custom access check + numeric uid', () => {
    const route = contactRoutes['entity.user.contact_form']!;
    expect(route.path).toBe('/user/{user}/contact');
    expect(route.requirements.accessContactPersonalTab).toBe(true);
    expect(route.requirements.paramConstraints?.user).toBe('\\d+');
  });

  it('requires the admin permission to manage the contact form collection', () => {
    expect(contactRoutes['entity.contact_form.collection']!.requirements.permission).toBe(
      'administer contact forms',
    );
    expect(contactRoutes['contact.form_add']!.requirements.permission).toBe(
      'administer contact forms',
    );
  });
});
