import { describe, expect, it } from 'vitest';
import { PluginSettingsBase } from './plugin-settings-base.js';

class Configurable extends PluginSettingsBase {
  static override defaultSettings(): Record<string, unknown> {
    return { color: 'red', size: 10 };
  }
}

function make(settings: Record<string, unknown> = {}) {
  return new Configurable('demo', { id: 'demo' }, settings);
}

describe('PluginSettingsBase', () => {
  it('exposes plugin id and definition', () => {
    const plugin = make();
    expect(plugin.getPluginId()).toBe('demo');
    expect(plugin.getPluginDefinition()).toEqual({ id: 'demo' });
  });

  it('merges instance settings over static defaults', () => {
    const plugin = make({ color: 'blue' });
    expect(plugin.getSettings()).toEqual({ color: 'blue', size: 10 });
    expect(plugin.getSetting('color')).toBe('blue');
    expect(plugin.getSetting('size')).toBe(10);
  });

  it('returns null for an unknown setting', () => {
    expect(make().getSetting('missing')).toBeNull();
  });

  it('supports fluent setSetting and setSettings', () => {
    const plugin = make();
    expect(plugin.setSetting('color', 'green')).toBe(plugin);
    expect(plugin.getSetting('color')).toBe('green');
    plugin.setSettings({ color: 'black' });
    // setSettings resets, defaults re-merge on read.
    expect(plugin.getSettings()).toEqual({ color: 'black', size: 10 });
  });

  it('stores and reads third-party settings', () => {
    const plugin = make();
    expect(plugin.getThirdPartySetting('other', 'k', 'fallback')).toBe('fallback');
    plugin.setThirdPartySetting('other', 'k', 'v');
    expect(plugin.getThirdPartySetting('other', 'k')).toBe('v');
  });

  it('reports no config change on dependency removal by default', () => {
    expect(make().onDependencyRemoval({ module: ['x'] })).toBe(false);
  });
});
