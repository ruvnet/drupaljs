import { describe, it, expect, vi } from 'vitest';
import { BlockPluginCollection, type BlockPlugin, type BlockPluginManager } from './block-plugin.js';

function manager(): BlockPluginManager {
  const plugin: BlockPlugin = {
    pluginId: 'system_powered_block',
    getConfiguration: vi.fn(() => ({ label: 'Powered' })),
    setConfiguration: vi.fn(),
    getPluginDefinition: () => ({ id: 'system_powered_block', admin_label: 'Powered by Drupal' }),
    label: () => 'Powered by Drupal',
  };
  return { createInstance: vi.fn(() => plugin) };
}

describe('BlockPluginCollection (lazy plugin holder)', () => {
  it('creates the plugin instance lazily and memoises it', () => {
    const m = manager();
    const collection = new BlockPluginCollection(m, 'system_powered_block', { label: 'Powered' });

    expect(m.createInstance).not.toHaveBeenCalled();
    const p1 = collection.get();
    const p2 = collection.get();

    expect(p1).toBe(p2);
    expect(m.createInstance).toHaveBeenCalledOnce();
    expect(m.createInstance).toHaveBeenCalledWith('system_powered_block', { label: 'Powered' });
  });

  it('exposes the underlying plugin configuration', () => {
    const collection = new BlockPluginCollection(manager(), 'system_powered_block', { label: 'Powered' });
    expect(collection.getConfiguration()).toEqual({ label: 'Powered' });
  });
});
