import { describe, it, expect, vi } from 'vitest';
import { EditorManager } from './editor-manager.js';
import { EditorBase } from './editor-base.js';
import { Editor } from './editor.js';
import type {
  EditorEntityInterface,
  EditorPluginDefinition,
  EditorStorageInterface,
} from './types.js';

class UnicornEditor extends EditorBase {
  override getDefaultSettings() {
    return { toolbar: ['bold'] };
  }
  override getJSSettings() {
    return { toolbar: this.configuration.toolbar ?? ['bold'] };
  }
  override getLibraries() {
    return ['unicorn/drupal.unicorn'];
  }
}

const unicornDef: EditorPluginDefinition = {
  id: 'unicorn',
  label: 'Unicorn Editor',
  supports_content_filtering: true,
  supports_inline_editing: false,
  is_xss_safe: false,
  supported_element_types: ['textarea'],
  provider: 'unicorn',
  class: UnicornEditor,
};

function makeStorage(
  editors: Record<string, EditorEntityInterface>,
): EditorStorageInterface {
  return { loadMultiple: vi.fn((ids: string[]) => {
    const out: Record<string, EditorEntityInterface> = {};
    for (const id of ids) if (editors[id]) out[id] = editors[id];
    return out;
  }) };
}

describe('EditorManager', () => {
  it('lists registered plugins as id => label options', () => {
    const manager = new EditorManager(makeStorage({}));
    manager.registerDefinition(unicornDef);
    expect(manager.listOptions()).toEqual({ unicorn: 'Unicorn Editor' });
  });

  it('reports definition existence and throws on unknown plugin instantiation', () => {
    const manager = new EditorManager(makeStorage({}));
    manager.registerDefinition(unicornDef);
    expect(manager.hasDefinition('unicorn')).toBe(true);
    expect(manager.hasDefinition('nope')).toBe(false);
    expect(() => manager.createInstance('nope')).toThrow();
  });

  it('creates a plugin instance carrying id, definition and configuration', () => {
    const manager = new EditorManager(makeStorage({}));
    manager.registerDefinition(unicornDef);
    const plugin = manager.createInstance('unicorn', { toolbar: ['x'] });
    expect(plugin).toBeInstanceOf(UnicornEditor);
    expect(plugin.getPluginId()).toBe('unicorn');
    expect(plugin.getJSSettings({} as EditorEntityInterface)).toEqual({ toolbar: ['x'] });
  });

  it('returns empty attachments when no editors are configured', () => {
    const manager = new EditorManager(makeStorage({}));
    manager.registerDefinition(unicornDef);
    expect(manager.getAttachments(['full_html'])).toEqual([]);
  });

  it('builds libraries and per-format drupalSettings for configured editors', () => {
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' });
    const manager = new EditorManager(makeStorage({ full_html: editor }));
    manager.registerDefinition(unicornDef);

    const attachments = manager.getAttachments(['full_html']);
    expect(attachments).not.toEqual([]);
    if (Array.isArray(attachments)) throw new Error('expected attachments object');

    expect(attachments.library).toEqual(['unicorn/drupal.unicorn']);
    expect(attachments.drupalSettings?.editor?.formats.full_html).toEqual({
      format: 'full_html',
      editor: 'unicorn',
      editorSettings: { toolbar: ['bold'] },
      editorSupportsContentFiltering: true,
      isXssSafe: false,
    });
  });

  it('statically caches editors so repeated formats are loaded once', () => {
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' });
    const storage = makeStorage({ full_html: editor });
    const manager = new EditorManager(storage);
    manager.registerDefinition(unicornDef);

    manager.getAttachments(['full_html']);
    manager.getAttachments(['full_html']);
    expect(storage.loadMultiple).toHaveBeenCalledTimes(1);
  });

  it('allows modules to alter aggregated JS settings', () => {
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' });
    const manager = new EditorManager(makeStorage({ full_html: editor }));
    manager.registerDefinition(unicornDef);
    manager.addJsSettingsAlter((settings) => {
      const format = settings.editor?.formats.full_html;
      if (format) format.editorSettings = { toolbar: ['altered'] };
    });

    const attachments = manager.getAttachments(['full_html']);
    if (Array.isArray(attachments)) throw new Error('expected attachments object');
    expect(
      attachments.drupalSettings?.editor?.formats.full_html?.editorSettings,
    ).toEqual({ toolbar: ['altered'] });
  });
});
