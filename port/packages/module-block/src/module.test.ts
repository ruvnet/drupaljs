import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  blockModule,
  blockPermissions,
  blockRoutes,
  installBlockModule,
  BLOCK_LIST_CACHE_TAG,
} from './module.js';

describe('block module definition', () => {
  it('declares the block module machine name and dependencies', () => {
    expect(blockModule.name).toBe('block');
    expect(blockModule.info?.dependencies).toContain('system');
  });

  it('defines the "administer blocks" permission (ported permissions.yml)', () => {
    expect(blockPermissions['administer blocks']).toEqual({ title: 'Administer blocks' });
  });

  it('ports the core admin routes with their access requirements', () => {
    const display = blockRoutes['block.admin_display'];
    expect(display?.path).toBe('/admin/structure/block');
    expect(display?.requirements?._permission).toBe('administer blocks');

    const editForm = blockRoutes['entity.block.edit_form'];
    expect(editForm?.path).toBe('/admin/structure/block/manage/{block}');
    expect(editForm?.requirements?._entity_access).toBe('block.update');
  });
});

describe('installBlockModule (hook registration via @drupaljs/hook)', () => {
  function setup() {
    const handler = new ModuleHandler();
    handler.setModuleList({ block: { name: 'block', weight: 0 } });
    installBlockModule(handler);
    return handler;
  }

  it('registers hook_theme returning a "block" theme hook', () => {
    const handler = setup();
    expect(handler.hasImplementations('theme', 'block')).toBe(true);
    const themed = handler.invoke('block', 'theme', []) as Record<string, unknown>;
    expect(themed).toHaveProperty('block');
  });

  it('registers hook_modules_installed, themes_installed, rebuild and entity-cleanup hooks', () => {
    const handler = setup();
    for (const hook of ['modules_installed', 'themes_installed', 'rebuild', 'user_role_delete']) {
      expect(handler.hasImplementations(hook, 'block')).toBe(true);
    }
  });

  it('only registers hooks for the block module', () => {
    const handler = setup();
    handler.invokeAllWith('theme', (_listener, module) => {
      expect(module).toBe('block');
    });
  });

  it('exposes a stable block_list cache tag used for invalidation', () => {
    expect(BLOCK_LIST_CACHE_TAG).toBe('config:block_list');
  });
});
