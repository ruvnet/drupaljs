import { describe, it, expect, vi } from 'vitest';
import { Block, sortBlocks } from './block.js';
import type { BlockPlugin, BlockPluginManager } from '../plugin/block-plugin.js';

/**
 * Builds a fake plugin manager whose plugins echo a fixed admin_label so the
 * entity's label() fallback can be exercised without a real plugin registry.
 */
function fakePluginManager(adminLabel = 'System Powered'): BlockPluginManager {
  const plugin: BlockPlugin = {
    pluginId: 'system_powered_block',
    getConfiguration: () => ({ label: '', label_display: 'visible' }),
    setConfiguration: vi.fn(),
    getPluginDefinition: () => ({ id: 'system_powered_block', admin_label: adminLabel }),
    label: () => adminLabel,
  };
  return { createInstance: vi.fn(() => plugin) };
}

describe('Block config entity', () => {
  it('exposes plugin id, region, theme and weight from config', () => {
    const block = new Block(
      {
        id: 'stark_powered',
        theme: 'stark',
        region: 'sidebar_first',
        weight: -5,
        plugin: 'system_powered_block',
        settings: { label: 'Powered', label_display: 'visible' },
      },
      fakePluginManager(),
    );

    expect(block.id()).toBe('stark_powered');
    expect(block.getPluginId()).toBe('system_powered_block');
    expect(block.getRegion()).toBe('sidebar_first');
    expect(block.getTheme()).toBe('stark');
    expect(block.getWeight()).toBe(-5);
  });

  it('returns the configured settings label, falling back to the plugin admin_label', () => {
    const labelled = new Block(
      { id: 'a', theme: 't', plugin: 'p', settings: { label: 'My Block', label_display: 'visible' } },
      fakePluginManager('Admin Label'),
    );
    expect(labelled.label()).toBe('My Block');

    const unlabelled = new Block(
      { id: 'b', theme: 't', plugin: 'p', settings: { label: '', label_display: 'visible' } },
      fakePluginManager('Admin Label'),
    );
    expect(unlabelled.label()).toBe('Admin Label');
  });

  it('lazily instantiates the plugin through the manager exactly once', () => {
    const manager = fakePluginManager();
    const block = new Block(
      { id: 'a', theme: 't', plugin: 'system_powered_block', settings: { foo: 'bar' } },
      manager,
    );

    const first = block.getPlugin();
    const second = block.getPlugin();

    expect(first).toBe(second);
    expect(manager.createInstance).toHaveBeenCalledTimes(1);
    expect(manager.createInstance).toHaveBeenCalledWith('system_powered_block', { foo: 'bar' });
  });

  it('coerces a non-integer weight to an integer on setWeight (ported preSave behaviour)', () => {
    const block = new Block({ id: 'a', theme: 't', plugin: 'p' }, fakePluginManager());
    block.setWeight(3.9 as unknown as number);
    expect(block.getWeight()).toBe(3);
  });

  it('setRegion / setWeight are chainable and mutate state', () => {
    const block = new Block({ id: 'a', theme: 't', plugin: 'p' }, fakePluginManager());
    const returned = block.setRegion('header').setWeight(2);
    expect(returned).toBe(block);
    expect(block.getRegion()).toBe('header');
    expect(block.getWeight()).toBe(2);
  });

  it('createDuplicateBlock clears the id and accepts overrides', () => {
    const block = new Block({ id: 'orig', theme: 'stark', plugin: 'p' }, fakePluginManager());
    const dup = block.createDuplicateBlock('copy', 'olivero');
    expect(dup).not.toBe(block);
    expect(dup.id()).toBe('copy');
    expect(dup.getTheme()).toBe('olivero');

    const blank = block.createDuplicateBlock();
    expect(blank.id()).toBeUndefined();
    expect(blank.getTheme()).toBe('stark');
  });

  it('getVisibility returns the visibility config map', () => {
    const block = new Block(
      { id: 'a', theme: 't', plugin: 'p', visibility: { user_role: { id: 'user_role', roles: ['admin'] } } },
      fakePluginManager(),
    );
    expect(block.getVisibility()).toEqual({ user_role: { id: 'user_role', roles: ['admin'] } });
  });

  it('setVisibilityConfig adds a new condition keyed by instance id', () => {
    const block = new Block({ id: 'a', theme: 't', plugin: 'p' }, fakePluginManager());
    block.setVisibilityConfig('request_path', { pages: '/admin/*' });
    expect(block.getVisibility().request_path).toEqual({ id: 'request_path', pages: '/admin/*' });
  });

  it('config export only emits the declared config_export keys', () => {
    const block = new Block(
      {
        id: 'a',
        theme: 't',
        region: 'r',
        weight: 1,
        provider: 'system',
        plugin: 'p',
        settings: { label: 'x' },
        visibility: {},
      },
      fakePluginManager(),
    );
    expect(Object.keys(block.toConfig()).sort()).toEqual(
      ['id', 'plugin', 'provider', 'region', 'settings', 'theme', 'visibility', 'weight'].sort(),
    );
  });
});

describe('sortBlocks (ported Block::sort)', () => {
  const make = (id: string, weight: number, status: boolean) =>
    new Block({ id, theme: 't', plugin: 'p', weight, status, settings: { label: id } }, fakePluginManager());

  it('puts enabled blocks before disabled ones', () => {
    const enabled = make('b', 10, true);
    const disabled = make('a', -10, false);
    expect(sortBlocks(enabled, disabled)).toBeLessThan(0);
  });

  it('orders by ascending weight within the same status', () => {
    expect(sortBlocks(make('x', -5, true), make('y', 5, true))).toBeLessThan(0);
  });

  it('falls back to label comparison when status and weight tie', () => {
    expect(sortBlocks(make('alpha', 0, true), make('beta', 0, true))).toBeLessThan(0);
  });
});
