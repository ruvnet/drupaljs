import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  theme,
  entityTypeAlter,
  registerHooks,
  MODULE_NAME,
  type AlterableEntityType,
} from './hooks.js';

/** Minimal mutable entity-type double. */
function makeEntityType(initial: Record<string, unknown> = {}): AlterableEntityType {
  const store = { ...initial };
  return {
    get: (key) => store[key],
    set: (key, value) => {
      store[key] = value;
    },
  };
}

describe('block_content hooks', () => {
  it('hook_theme declares the deprecated add-list template', () => {
    const themes = theme();
    expect(themes.block_content_add_list).toBeDefined();
    expect((themes.block_content_add_list as any).variables).toEqual({ content: null });
  });

  describe('hook_entity_type_alter', () => {
    it('marks block_content translatable when language is enabled', () => {
      const mh = new ModuleHandler();
      mh.setModuleList({ block_content: { name: 'block_content' }, language: { name: 'language' } });
      const bc = makeEntityType();
      entityTypeAlter({ block_content: bc }, mh);
      expect(bc.get('translation')).toEqual({ block_content: true });
    });

    it('is a no-op when language is not enabled', () => {
      const mh = new ModuleHandler();
      mh.setModuleList({ block_content: { name: 'block_content' } });
      const bc = makeEntityType();
      entityTypeAlter({ block_content: bc }, mh);
      expect(bc.get('translation')).toBeUndefined();
    });

    it('preserves existing translation settings', () => {
      const mh = new ModuleHandler();
      mh.setModuleList({ language: { name: 'language' } });
      const bc = makeEntityType({ translation: { other: true } });
      entityTypeAlter({ block_content: bc }, mh);
      expect(bc.get('translation')).toEqual({ other: true, block_content: true });
    });
  });

  describe('registerHooks', () => {
    it('registers theme and entity_type_alter against the module handler', () => {
      const mh = new ModuleHandler();
      mh.setModuleList({ block_content: { name: 'block_content' } });
      registerHooks(mh);

      expect(mh.hasImplementations('theme')).toBe(true);
      expect(mh.getImplementations('theme')).toContain(MODULE_NAME);

      const result = mh.invoke(MODULE_NAME, 'theme', []) as Record<string, unknown>;
      expect(result.block_content_add_list).toBeDefined();
    });

    it('runs the registered entity_type_alter via the handler', () => {
      const mh = new ModuleHandler();
      mh.setModuleList({ block_content: { name: 'block_content' }, language: { name: 'language' } });
      registerHooks(mh);

      const bc = makeEntityType();
      mh.invoke(MODULE_NAME, 'entity_type_alter', [{ block_content: bc }]);
      expect(bc.get('translation')).toEqual({ block_content: true });
    });
  });
});
