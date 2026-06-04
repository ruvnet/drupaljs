import { describe, it, expect } from 'vitest';
import { Menu, MENU_ENTITY_TYPE } from './menu.js';

describe('Menu config entity', () => {
  it('exposes its entity type id and config-export keys (ConfigEntityType faithful)', () => {
    expect(MENU_ENTITY_TYPE.id).toBe('menu');
    expect(MENU_ENTITY_TYPE.admin_permission).toBe('administer menu');
    expect(MENU_ENTITY_TYPE.config_export).toEqual(['id', 'label', 'description', 'locked']);
    expect(MENU_ENTITY_TYPE.entity_keys).toEqual({ id: 'id', label: 'label' });
  });

  it('reads id, label and description', () => {
    const menu = new Menu({ id: 'tools', label: 'Tools', description: 'Tools menu' });
    expect(menu.id()).toBe('tools');
    expect(menu.label()).toBe('Tools');
    expect(menu.getDescription()).toBe('Tools menu');
  });

  it('defaults locked to false and reflects an explicit lock', () => {
    expect(new Menu({ id: 'a' }).isLocked()).toBe(false);
    expect(new Menu({ id: 'admin', locked: true }).isLocked()).toBe(true);
  });

  it('serializes only the config_export keys via toArray()', () => {
    const menu = new Menu({ id: 'main', label: 'Main', description: 'Main nav', locked: true });
    expect(menu.toArray()).toEqual({
      id: 'main',
      label: 'Main',
      description: 'Main nav',
      locked: true,
    });
  });

  it('reports its entity type id', () => {
    expect(new Menu({ id: 'x' }).getEntityTypeId()).toBe('menu');
  });
});
