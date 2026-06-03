import { describe, it, expect, vi } from 'vitest';
import { ImageEffectManager } from './image-effect-manager.js';
import { ResizeImageEffect } from './effect/resize-image-effect.js';
import { ScaleImageEffect } from './effect/scale-image-effect.js';
import { PluginNotFoundException } from './image-effect-manager.js';
import type { LoggerInterface } from './contracts.js';

const logger: LoggerInterface = { error: vi.fn() };

function manager(): ImageEffectManager {
  const m = new ImageEffectManager(logger);
  m.registerDefinition({ id: 'image_resize', label: 'Resize', class: ResizeImageEffect, provider: 'image' });
  m.registerDefinition({ id: 'image_scale', label: 'Scale', class: ScaleImageEffect, provider: 'image' });
  return m;
}

describe('ImageEffectManager', () => {
  it('lists registered definitions', () => {
    const m = manager();
    expect(Object.keys(m.getDefinitions()).sort()).toEqual(['image_resize', 'image_scale']);
  });

  it('returns a definition by id', () => {
    expect(manager().getDefinition('image_scale').label).toBe('Scale');
  });

  it('throws PluginNotFoundException for an unknown id', () => {
    expect(() => manager().getDefinition('nope')).toThrow(PluginNotFoundException);
  });

  it('hasDefinition reflects registration', () => {
    const m = manager();
    expect(m.hasDefinition('image_resize')).toBe(true);
    expect(m.hasDefinition('nope')).toBe(false);
  });

  it('creates a configured effect instance from id + configuration', () => {
    const m = manager();
    const effect = m.createInstance('image_resize', {
      uuid: 'u9',
      id: 'image_resize',
      weight: 2,
      data: { width: 30, height: 20 },
    });
    expect(effect).toBeInstanceOf(ResizeImageEffect);
    expect(effect.getUuid()).toBe('u9');
    expect(effect.getWeight()).toBe(2);
    expect(effect.getConfiguration().data).toEqual({ width: 30, height: 20 });
  });
});
