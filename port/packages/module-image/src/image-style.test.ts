import { describe, it, expect, vi } from 'vitest';
import { ImageStyle } from './image-style.js';
import { ImageEffectManager } from './image-effect-manager.js';
import { ResizeImageEffect } from './effect/resize-image-effect.js';
import { ScaleImageEffect } from './effect/scale-image-effect.js';
import { ConvertImageEffect } from './effect/convert-image-effect.js';
import type {
  Dimensions,
  ImageFactoryInterface,
  ImageInterface,
  LoggerInterface,
} from './contracts.js';

const logger: LoggerInterface = { error: vi.fn() };

function effectManager(): ImageEffectManager {
  const m = new ImageEffectManager(logger);
  m.registerDefinition({ id: 'image_resize', label: 'Resize', class: ResizeImageEffect, provider: 'image' });
  m.registerDefinition({ id: 'image_scale', label: 'Scale', class: ScaleImageEffect, provider: 'image' });
  m.registerDefinition({ id: 'image_convert', label: 'Convert', class: ConvertImageEffect, provider: 'image' });
  return m;
}

let uuidCounter = 0;
const uuidGenerator = () => `uuid-${++uuidCounter}`;

function mockImage(valid = true): ImageInterface {
  return {
    isValid: vi.fn(() => valid),
    getWidth: vi.fn(() => 200),
    getHeight: vi.fn(() => 100),
    getToolkitId: vi.fn(() => 'gd'),
    getSource: vi.fn(() => 'public://x.png'),
    getMimeType: vi.fn(() => 'image/png'),
    resize: vi.fn(() => true),
    scale: vi.fn(() => true),
    crop: vi.fn(() => true),
    rotate: vi.fn(() => true),
    desaturate: vi.fn(() => true),
    convert: vi.fn(() => true),
    apply: vi.fn(() => true),
    save: vi.fn(() => true),
  };
}

function imageFactory(image: ImageInterface): ImageFactoryInterface {
  return {
    get: vi.fn(() => image),
    getSupportedExtensions: vi.fn(() => ['png', 'jpg', 'gif']),
  };
}

function newStyle(overrides: Partial<ConstructorParameters<typeof ImageStyle>[0]> = {}): ImageStyle {
  return new ImageStyle({
    values: { name: 'thumbnail', label: 'Thumbnail', effects: {} },
    effectManager: effectManager(),
    imageFactory: imageFactory(mockImage()),
    uuidGenerator,
    ...overrides,
  });
}

describe('ImageStyle identity', () => {
  it('exposes id/name/label', () => {
    const style = newStyle();
    expect(style.id()).toBe('thumbnail');
    expect(style.getName()).toBe('thumbnail');
    expect(style.label()).toBe('Thumbnail');
  });

  it('setName updates id', () => {
    const style = newStyle();
    style.setName('large');
    expect(style.id()).toBe('large');
  });
});

describe('ImageStyle effect collection', () => {
  it('orders effects by ascending weight', () => {
    const style = new ImageStyle({
      values: {
        name: 's',
        label: 'S',
        effects: {
          a: { uuid: 'a', id: 'image_scale', weight: 5, data: { width: 100, height: null, upscale: false } },
          b: { uuid: 'b', id: 'image_resize', weight: 1, data: { width: 40, height: 30 } },
        },
      },
      effectManager: effectManager(),
      imageFactory: imageFactory(mockImage()),
      uuidGenerator,
    });
    const ids = style.getEffects().map((e) => e.getPluginId());
    expect(ids).toEqual(['image_resize', 'image_scale']);
  });

  it('addImageEffect generates a uuid and appends the effect', () => {
    const style = newStyle();
    const uuid = style.addImageEffect({ id: 'image_resize', weight: 0, data: { width: 50, height: 50 } });
    expect(uuid).toMatch(/^uuid-/);
    expect(style.getEffect(uuid)).toBeDefined();
    expect(style.getEffects()).toHaveLength(1);
  });

  it('deleteImageEffect removes the effect instance', () => {
    const style = newStyle();
    const uuid = style.addImageEffect({ id: 'image_resize', weight: 0, data: { width: 50, height: 50 } });
    const effect = style.getEffect(uuid)!;
    style.deleteImageEffect(effect);
    expect(style.getEffect(uuid)).toBeUndefined();
    expect(style.getEffects()).toHaveLength(0);
  });
});

describe('ImageStyle dimension + extension transforms', () => {
  it('chains transformDimensions across effects in order', () => {
    const style = new ImageStyle({
      values: {
        name: 's',
        label: 'S',
        effects: {
          a: { uuid: 'a', id: 'image_resize', weight: 1, data: { width: 400, height: 200 } },
          b: { uuid: 'b', id: 'image_scale', weight: 2, data: { width: 100, height: null, upscale: false } },
        },
      },
      effectManager: effectManager(),
      imageFactory: imageFactory(mockImage()),
      uuidGenerator,
    });
    const dims: Dimensions = { width: 1000, height: 1000 };
    style.transformDimensions(dims, 'public://x.png');
    // resize -> 400x200, scale to width 100 -> 100x50.
    expect(dims).toEqual({ width: 100, height: 50 });
  });

  it('computes the derivative extension through convert effects', () => {
    const style = newStyle();
    style.addImageEffect({ id: 'image_convert', weight: 0, data: { extension: 'jpg' } });
    expect(style.getDerivativeExtension('png')).toBe('jpg');
  });
});

describe('ImageStyle buildUri', () => {
  it('builds a styled derivative uri preserving the source scheme and target path', () => {
    const style = newStyle();
    // Drupal keeps the full target ("field/image.png") under the style dir.
    expect(style.buildUri('public://field/image.png')).toBe(
      'public://styles/thumbnail/public/field/image.png',
    );
  });

  it('appends the new extension when a convert effect changes it', () => {
    const style = newStyle();
    style.addImageEffect({ id: 'image_convert', weight: 0, data: { extension: 'jpg' } });
    expect(style.buildUri('public://image.png')).toBe('public://styles/thumbnail/public/image.png.jpg');
  });

  it('treats a schemeless path as the default (public) scheme', () => {
    const style = newStyle();
    expect(style.buildUri('image.png')).toBe('public://styles/thumbnail/public/image.png');
  });
});

describe('ImageStyle createDerivative', () => {
  it('applies every effect to the image then saves to the derivative uri', () => {
    const image = mockImage();
    const factory = imageFactory(image);
    const style = new ImageStyle({
      values: {
        name: 's',
        label: 'S',
        effects: { a: { uuid: 'a', id: 'image_resize', weight: 1, data: { width: 40, height: 30 } } },
      },
      effectManager: effectManager(),
      imageFactory: factory,
      uuidGenerator,
    });
    const result = style.createDerivative('public://x.png', 'public://styles/s/public/x.png');
    expect(result).toBe(true);
    expect(factory.get).toHaveBeenCalledWith('public://x.png');
    expect(image.resize).toHaveBeenCalledWith(40, 30);
    expect(image.save).toHaveBeenCalledWith('public://styles/s/public/x.png');
  });

  it('returns false without saving when the source image is invalid', () => {
    const image = mockImage(false);
    const factory = imageFactory(image);
    const style = newStyle({ imageFactory: factory });
    expect(style.createDerivative('public://missing.png', 'public://d.png')).toBe(false);
    expect(image.save).not.toHaveBeenCalled();
  });
});

describe('ImageStyle supportsUri', () => {
  it('is true for supported extensions and false otherwise', () => {
    const style = newStyle();
    expect(style.supportsUri('public://x.PNG')).toBe(true);
    expect(style.supportsUri('public://x.bmp')).toBe(false);
  });
});
