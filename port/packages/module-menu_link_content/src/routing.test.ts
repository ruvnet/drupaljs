import { describe, it, expect } from 'vitest';
import { menuLinkContentRoutes, menuLinkContentPermissions } from './routing.js';

describe('menu_link_content routing', () => {
  it('defines the edit, delete and add-link routes', () => {
    expect(menuLinkContentRoutes['entity.menu_link_content.edit_form']?.path).toBe(
      '/admin/structure/menu/item/{menu_link_content}/edit',
    );
    expect(menuLinkContentRoutes['entity.menu_link_content.delete_form']?.requirements._entity_access).toBe(
      'menu_link_content.delete',
    );
    expect(menuLinkContentRoutes['entity.menu.add_link_form']?.requirements._entity_create_access).toBe(
      'menu_link_content',
    );
  });

  it('declares the permissions consulted by access control', () => {
    expect(menuLinkContentPermissions).toContain('administer menu');
    expect(menuLinkContentPermissions).toContain('link to any page');
  });
});
