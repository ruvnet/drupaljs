import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  IMAGE_MODULE_NAME,
  imagePermissions,
  imageRoutes,
  registerImageEffects,
  installImageModule,
} from './image-module.js';
import { ImageEffectManager } from './image-effect-manager.js';
import { ResizeImageEffect } from './effect/resize-image-effect.js';
import { ScaleImageEffect } from './effect/scale-image-effect.js';
import { CropImageEffect } from './effect/crop-image-effect.js';
import { ScaleAndCropImageEffect } from './effect/scale-and-crop-image-effect.js';
import { RotateImageEffect } from './effect/rotate-image-effect.js';
import { DesaturateImageEffect } from './effect/desaturate-image-effect.js';
import { ConvertImageEffect } from './effect/convert-image-effect.js';
import type { LoggerInterface } from './contracts.js';

const logger: LoggerInterface = { error: vi.fn() };

describe('image permissions', () => {
  it('declares "administer image styles" (from image.permissions.yml)', () => {
    expect(imagePermissions['administer image styles']).toEqual({ title: 'Administer image styles' });
  });
});

describe('image routes', () => {
  it('declares the image style collection and download routes (from image.routing.yml)', () => {
    expect(imageRoutes['entity.image_style.collection']?.path).toBe('/admin/config/media/image-styles');
    expect(imageRoutes['image.style_add']?.path).toBe('/admin/config/media/image-styles/add');
    expect(imageRoutes['image.style_add']?.requirements?._permission).toBe('administer image styles');
  });
});

describe('registerImageEffects', () => {
  it('registers all bundled effect plugins keyed by their plugin id', () => {
    const manager = new ImageEffectManager(logger);
    registerImageEffects(manager);
    const defs = manager.getDefinitions();
    expect(Object.keys(defs).sort()).toEqual(
      [
        'image_convert',
        'image_crop',
        'image_desaturate',
        'image_resize',
        'image_rotate',
        'image_scale',
        'image_scale_and_crop',
      ].sort(),
    );
    expect(defs['image_resize']!.class).toBe(ResizeImageEffect);
    expect(defs['image_scale']!.class).toBe(ScaleImageEffect);
    expect(defs['image_crop']!.class).toBe(CropImageEffect);
    expect(defs['image_scale_and_crop']!.class).toBe(ScaleAndCropImageEffect);
    expect(defs['image_rotate']!.class).toBe(RotateImageEffect);
    expect(defs['image_desaturate']!.class).toBe(DesaturateImageEffect);
    expect(defs['image_convert']!.class).toBe(ConvertImageEffect);
    // Provider is the module machine name.
    expect(defs['image_resize']!.provider).toBe(IMAGE_MODULE_NAME);
  });
});

describe('installImageModule', () => {
  it('enables the image module and registers its hook implementations', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ image: { name: 'image' } });
    installImageModule(handler);

    expect(handler.hasImplementations('image_style_flush', 'image')).toBe(true);
    expect(handler.getImplementations('help')).toContain('image');
  });

  it('hook_help returns module help for help.page.image and undefined otherwise', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ image: { name: 'image' } });
    installImageModule(handler);

    const help = handler.invoke('image', 'help', ['help.page.image']);
    expect(String(help)).toContain('Image module');
    expect(handler.invoke('image', 'help', ['help.page.other'])).toBeUndefined();
  });
});
