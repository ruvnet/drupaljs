import { describe, it, expect, vi } from 'vitest';
import {
  PATH_MODULE_NAME,
  PATH_ALIAS_LINK_TEMPLATES,
  registerPathHooks,
  pathHelp,
  pathEntityBaseFieldInfo,
} from './hooks.js';
import { PATH_PERMISSIONS } from './types.js';
import type { HookRegistrarLike } from './types.js';

describe('PATH_PERMISSIONS', () => {
  it('matches path.permissions.yml', () => {
    expect(PATH_PERMISSIONS['administer url aliases'].title).toBe(
      'Administer URL aliases',
    );
    expect(PATH_PERMISSIONS['create url aliases'].title).toBe(
      'Create and edit URL aliases',
    );
  });
});

describe('registerPathHooks', () => {
  it('registers the ported hook implementations under the "path" module', () => {
    const handler: HookRegistrarLike = { implement: vi.fn() };
    registerPathHooks(handler);

    const hooks = (handler.implement as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[1],
    );
    expect(hooks).toContain('help');
    expect(hooks).toContain('entity_type_alter');
    expect(hooks).toContain('entity_base_field_info');
    expect(hooks).toContain('entity_translation_create');

    // Every registration is attributed to the path module.
    for (const call of (handler.implement as ReturnType<typeof vi.fn>).mock.calls) {
      expect(call[0]).toBe(PATH_MODULE_NAME);
    }
  });
});

describe('pathHelp', () => {
  it('returns help for the help page route', () => {
    expect(pathHelp('help.page.path')).toContain('Path module');
  });

  it('returns collection help for the alias collection route', () => {
    expect(pathHelp('entity.path_alias.collection')).toContain('alias');
  });

  it('returns null for an unknown route', () => {
    expect(pathHelp('some.other.route')).toBeNull();
  });
});

describe('pathEntityBaseFieldInfo', () => {
  it('adds a computed "path" field to supported entity types', () => {
    for (const id of ['node', 'taxonomy_term', 'media']) {
      const fields = pathEntityBaseFieldInfo(id);
      expect(fields.path).toBeDefined();
      expect(fields.path?.type).toBe('path');
      expect(fields.path?.computed).toBe(true);
      expect(fields.path?.translatable).toBe(true);
    }
  });

  it('adds nothing for unsupported entity types', () => {
    expect(pathEntityBaseFieldInfo('user')).toEqual({});
  });
});

describe('entity_type_alter link templates', () => {
  it('defines the admin collection/add/edit/delete routes', () => {
    expect(PATH_ALIAS_LINK_TEMPLATES.collection).toBe('/admin/config/search/path');
    expect(PATH_ALIAS_LINK_TEMPLATES['add-form']).toBe(
      '/admin/config/search/path/add',
    );
    expect(PATH_ALIAS_LINK_TEMPLATES['edit-form']).toBe(
      '/admin/config/search/path/edit/{path_alias}',
    );
    expect(PATH_ALIAS_LINK_TEMPLATES['delete-form']).toBe(
      '/admin/config/search/path/delete/{path_alias}',
    );
  });
});
