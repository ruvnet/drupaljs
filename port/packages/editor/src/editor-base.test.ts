import { describe, it, expect } from 'vitest';
import { EditorBase } from './editor-base.js';
import type { EditorEntityInterface, EditorPluginDefinition } from './types.js';

const definition: EditorPluginDefinition = {
  id: 'unicorn',
  label: 'Unicorn Editor',
  supports_content_filtering: true,
  supports_inline_editing: false,
  is_xss_safe: false,
  supported_element_types: ['textarea'],
};

class UnicornEditor extends EditorBase {}

const stubEditor = {} as EditorEntityInterface;

describe('EditorBase', () => {
  it('exposes plugin id and definition via inspection', () => {
    const plugin = new UnicornEditor({}, 'unicorn', definition);
    expect(plugin.getPluginId()).toBe('unicorn');
    expect(plugin.getPluginDefinition()).toBe(definition);
  });

  it('returns empty default settings', () => {
    const plugin = new UnicornEditor({}, 'unicorn', definition);
    expect(plugin.getDefaultSettings()).toEqual({});
  });

  it('returns empty JS settings by default', () => {
    const plugin = new UnicornEditor({}, 'unicorn', definition);
    expect(plugin.getJSSettings(stubEditor)).toEqual({});
  });

  it('returns no libraries by default', () => {
    const plugin = new UnicornEditor({}, 'unicorn', definition);
    expect(plugin.getLibraries(stubEditor)).toEqual([]);
  });

  it('lets subclasses override defaults', () => {
    class Configured extends EditorBase {
      override getDefaultSettings() {
        return { toolbar: ['bold'] };
      }
      override getLibraries(_editor: EditorEntityInterface) {
        return ['unicorn/drupal.unicorn'];
      }
    }
    const plugin = new Configured({}, 'unicorn', definition);
    expect(plugin.getDefaultSettings()).toEqual({ toolbar: ['bold'] });
    expect(plugin.getLibraries(stubEditor)).toEqual(['unicorn/drupal.unicorn']);
  });
});
