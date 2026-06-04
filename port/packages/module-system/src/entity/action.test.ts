import { describe, it, expect, vi } from 'vitest';
import { Action, ACTION_ENTITY_TYPE } from './action.js';
import type { ActionPluginManagerLike } from './action.js';

describe('Action config entity', () => {
  it('exposes its entity type id and config-export keys (ConfigEntityType faithful)', () => {
    expect(ACTION_ENTITY_TYPE.id).toBe('action');
    expect(ACTION_ENTITY_TYPE.admin_permission).toBe('administer actions');
    expect(ACTION_ENTITY_TYPE.config_export).toEqual([
      'id',
      'label',
      'type',
      'plugin',
      'configuration',
    ]);
  });

  it('reads id, label, type, plugin and configuration', () => {
    const action = new Action({
      id: 'node_publish',
      label: 'Publish',
      type: 'node',
      plugin: 'entity:publish_action:node',
      configuration: { foo: 'bar' },
    });
    expect(action.id()).toBe('node_publish');
    expect(action.label()).toBe('Publish');
    expect(action.getType()).toBe('node');
  });

  it('defaults type to undefined and configuration to {}', () => {
    const action = new Action({ id: 'x', plugin: 'p' });
    expect(action.getType()).toBeUndefined();
    expect(action.toArray().configuration).toEqual({});
  });

  it('serializes only the config_export keys via toArray()', () => {
    const action = new Action({
      id: 'a',
      label: 'A',
      type: 'system',
      plugin: 'p',
      configuration: { k: 1 },
    });
    expect(action.toArray()).toEqual({
      id: 'a',
      label: 'A',
      type: 'system',
      plugin: 'p',
      configuration: { k: 1 },
    });
  });

  describe('isConfigurable()', () => {
    it('is true when the plugin instance is configurable', () => {
      const manager: ActionPluginManagerLike = {
        getDefinition: vi.fn(),
        createInstance: vi.fn(() => ({
          getPluginId: () => 'p',
          getPluginDefinition: () => ({ id: 'p' }),
          // Marker for ConfigurableInterface (defaultConfiguration present).
          defaultConfiguration: () => ({}),
        })),
      };
      const action = new Action({ id: 'a', plugin: 'p' }, manager);
      expect(action.isConfigurable()).toBe(true);
      expect(manager.createInstance).toHaveBeenCalledWith('p', {});
    });

    it('is false when the plugin instance is not configurable', () => {
      const manager: ActionPluginManagerLike = {
        getDefinition: vi.fn(),
        createInstance: vi.fn(() => ({
          getPluginId: () => 'p',
          getPluginDefinition: () => ({ id: 'p' }),
        })),
      };
      const action = new Action({ id: 'a', plugin: 'p' }, manager);
      expect(action.isConfigurable()).toBe(false);
    });
  });

  describe('Action.create()', () => {
    it('defaults the label to the plugin definition label when omitted', () => {
      const manager: ActionPluginManagerLike = {
        getDefinition: vi.fn(() => ({ id: 'p', label: 'Plugin Label' })),
        createInstance: vi.fn(),
      };
      const action = Action.create({ plugin: 'p' }, manager);
      expect(manager.getDefinition).toHaveBeenCalledWith('p');
      expect(action.label()).toBe('Plugin Label');
    });

    it('keeps an explicit label even when a plugin is set', () => {
      const manager: ActionPluginManagerLike = {
        getDefinition: vi.fn(() => ({ id: 'p', label: 'Plugin Label' })),
        createInstance: vi.fn(),
      };
      const action = Action.create({ plugin: 'p', label: 'Explicit' }, manager);
      expect(manager.getDefinition).not.toHaveBeenCalled();
      expect(action.label()).toBe('Explicit');
    });
  });

  describe('Action.sort()', () => {
    it('orders by type first (natural, case-insensitive), then by label', () => {
      const a = new Action({ id: 'a', label: 'Zebra', type: 'comment' });
      const b = new Action({ id: 'b', label: 'Apple', type: 'node' });
      const c = new Action({ id: 'c', label: 'Apple', type: 'comment' });
      const sorted = [a, b, c].sort(Action.sort);
      // comment < node by type; within comment, Apple(c) < Zebra(a) by label.
      expect(sorted.map((e) => e.id())).toEqual(['c', 'a', 'b']);
    });
  });
});
