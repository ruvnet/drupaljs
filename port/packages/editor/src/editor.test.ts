import { describe, it, expect, vi } from 'vitest';
import { Editor } from './editor.js';
import type { FilterFormatInterface } from './types.js';

function makeFormat(id = 'full_html'): FilterFormatInterface {
  return {
    id: () => id,
    label: () => 'Full HTML',
    getConfigDependencyName: () => `filter.format.${id}`,
  };
}

describe('Editor entity', () => {
  it('uses the format as its id', () => {
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' });
    expect(editor.id()).toBe('full_html');
  });

  it('reports an associated filter format only when a format is set', () => {
    expect(new Editor({ format: 'full_html' }).hasAssociatedFilterFormat()).toBe(true);
    expect(new Editor({}).hasAssociatedFilterFormat()).toBe(false);
  });

  it('seeds settings from the editor plugin default settings on construction', () => {
    const editor = new Editor(
      { format: 'full_html', editor: 'unicorn', settings: { toolbar: ['custom'] } },
      { defaultSettingsFor: () => ({ toolbar: ['bold'], heading: true }) },
    );
    // Existing settings win; defaults only fill missing keys (PHP `+=`).
    expect(editor.getSettings()).toEqual({ toolbar: ['custom'], heading: true });
  });

  it('tolerates a missing editor plugin when seeding defaults', () => {
    const resolver = {
      defaultSettingsFor: vi.fn(() => {
        throw new Error('PluginNotFound');
      }),
    };
    const editor = new Editor({ format: 'full_html', editor: 'gone' }, resolver);
    expect(editor.getSettings()).toEqual({});
    expect(resolver.defaultSettingsFor).toHaveBeenCalledWith('gone');
  });

  it('reads and writes the editor plugin id fluently', () => {
    const editor = new Editor({ format: 'full_html' });
    expect(editor.setEditor('unicorn')).toBe(editor);
    expect(editor.getEditor()).toBe('unicorn');
  });

  it('reads and writes settings fluently', () => {
    const editor = new Editor({ format: 'full_html' });
    expect(editor.setSettings({ a: 1 })).toBe(editor);
    expect(editor.getSettings()).toEqual({ a: 1 });
  });

  it('reads and writes image upload settings fluently', () => {
    const editor = new Editor({ format: 'full_html' });
    expect(editor.setImageUploadSettings({ status: true })).toBe(editor);
    expect(editor.getImageUploadSettings()).toEqual({ status: true });
  });

  it('lazily resolves and caches the filter format via the resolver', () => {
    const format = makeFormat();
    const resolver = { loadFilterFormat: vi.fn(() => format) };
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' }, resolver);
    expect(editor.getFilterFormat()).toBe(format);
    expect(editor.getFilterFormat()).toBe(format);
    expect(resolver.loadFilterFormat).toHaveBeenCalledTimes(1);
  });

  it('labels itself using the filter format label', () => {
    const resolver = { loadFilterFormat: () => makeFormat() };
    const editor = new Editor({ format: 'full_html' }, resolver);
    expect(editor.label()).toBe('Full HTML');
  });

  it('depends on its filter format config when calculating dependencies', () => {
    const resolver = { loadFilterFormat: () => makeFormat() };
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' }, resolver);
    expect(editor.calculateDependencies()).toEqual({
      config: ['filter.format.full_html'],
      module: [],
    });
  });

  it('adds the plugin provider as a module dependency when known', () => {
    const resolver = {
      loadFilterFormat: () => makeFormat(),
      providerFor: () => 'unicorn',
    };
    const editor = new Editor({ format: 'full_html', editor: 'unicorn' }, resolver);
    expect(editor.calculateDependencies().module).toEqual(['unicorn']);
  });
});
