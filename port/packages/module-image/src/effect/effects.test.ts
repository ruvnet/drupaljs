import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResizeImageEffect } from './resize-image-effect.js';
import { ScaleImageEffect } from './scale-image-effect.js';
import { CropImageEffect } from './crop-image-effect.js';
import { ScaleAndCropImageEffect } from './scale-and-crop-image-effect.js';
import { RotateImageEffect } from './rotate-image-effect.js';
import { DesaturateImageEffect } from './desaturate-image-effect.js';
import { ConvertImageEffect } from './convert-image-effect.js';
import type {
  Dimensions,
  ImageEffectConstructor,
  ImageEffectPluginDefinition,
  ImageInterface,
  LoggerInterface,
} from '../contracts.js';

const def = (id: string, label: string): ImageEffectPluginDefinition => ({
  id,
  label,
  class: undefined as unknown as ImageEffectConstructor,
});

const makeLogger = (): LoggerInterface => ({ error: vi.fn() });

/** A toolkit image mock with the operations the effects call. */
function mockImage(width = 200, height = 100): ImageInterface {
  return {
    isValid: vi.fn(() => true),
    getWidth: vi.fn(() => width),
    getHeight: vi.fn(() => height),
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

describe('ImageEffectBase configuration', () => {
  let logger: LoggerInterface;
  beforeEach(() => {
    logger = makeLogger();
  });

  it('round-trips configuration (data + uuid + weight) merged over defaults', () => {
    const effect = new ResizeImageEffect({}, 'image_resize', def('image_resize', 'Resize'), logger);
    effect.setConfiguration({ uuid: 'u1', weight: 3, data: { width: 50, height: 40 } });

    const config = effect.getConfiguration();
    expect(config).toEqual({
      uuid: 'u1',
      id: 'image_resize',
      weight: 3,
      data: { width: 50, height: 40 },
    });
    expect(effect.getUuid()).toBe('u1');
    expect(effect.getWeight()).toBe(3);
    expect(effect.label()).toBe('Resize');
  });

  it('fills missing data keys from defaultConfiguration', () => {
    const effect = new ScaleImageEffect({}, 'image_scale', def('image_scale', 'Scale'), logger);
    effect.setConfiguration({ data: { width: 80 } });
    // upscale comes from ScaleImageEffect.defaultConfiguration().
    expect(effect.getConfiguration().data).toEqual({ width: 80, height: null, upscale: false });
  });

  it('does not change extension by default', () => {
    const effect = new ResizeImageEffect({}, 'image_resize', def('image_resize', 'Resize'), logger);
    expect(effect.getDerivativeExtension('png')).toBe('png');
  });
});

describe('ResizeImageEffect', () => {
  it('resizes to the exact configured dimensions', () => {
    const logger = makeLogger();
    const effect = new ResizeImageEffect({ width: 50, height: 40 }, 'image_resize', def('image_resize', 'Resize'), logger);
    const image = mockImage();
    expect(effect.applyEffect(image)).toBe(true);
    expect(image.resize).toHaveBeenCalledWith(50, 40);
  });

  it('sets transformed dimensions to the exact configured values', () => {
    const logger = makeLogger();
    const effect = new ResizeImageEffect({ width: 50, height: 40 }, 'image_resize', def('image_resize', 'Resize'), logger);
    const dims: Dimensions = { width: 200, height: 100 };
    effect.transformDimensions(dims, 'public://x.png');
    expect(dims).toEqual({ width: 50, height: 40 });
  });

  it('logs and returns false when the toolkit resize fails', () => {
    const logger = makeLogger();
    const effect = new ResizeImageEffect({ width: 50, height: 40 }, 'image_resize', def('image_resize', 'Resize'), logger);
    const image = mockImage();
    (image.resize as ReturnType<typeof vi.fn>).mockReturnValue(false);
    expect(effect.applyEffect(image)).toBe(false);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

describe('ScaleImageEffect', () => {
  it('scales via the toolkit with the upscale flag', () => {
    const logger = makeLogger();
    const effect = new ScaleImageEffect({ width: 100, height: null, upscale: true }, 'image_scale', def('image_scale', 'Scale'), logger);
    const image = mockImage();
    effect.applyEffect(image);
    expect(image.scale).toHaveBeenCalledWith(100, null, true);
  });

  it('transforms dimensions preserving aspect ratio', () => {
    const logger = makeLogger();
    const effect = new ScaleImageEffect({ width: 100, height: null, upscale: false }, 'image_scale', def('image_scale', 'Scale'), logger);
    const dims: Dimensions = { width: 200, height: 100 };
    effect.transformDimensions(dims, 'public://x.png');
    expect(dims).toEqual({ width: 100, height: 50 });
  });
});

describe('CropImageEffect', () => {
  it('computes the anchor offset and crops', () => {
    const logger = makeLogger();
    const effect = new CropImageEffect({ width: 100, height: 50, anchor: 'center-center' }, 'image_crop', def('image_crop', 'Crop'), logger);
    const image = mockImage(200, 100);
    effect.applyEffect(image);
    // center-center on 200x100 cropping to 100x50 => x=50, y=25.
    expect(image.crop).toHaveBeenCalledWith(50, 25, 100, 50);
  });
});

describe('ScaleAndCropImageEffect', () => {
  it('scales to cover then crops via the generic toolkit op', () => {
    const logger = makeLogger();
    const effect = new ScaleAndCropImageEffect({ width: 100, height: 100, anchor: 'center-center' }, 'image_scale_and_crop', def('image_scale_and_crop', 'Scale and crop'), logger);
    const image = mockImage(200, 100); // scale factor = max(0.5, 1.0) = 1.0
    effect.applyEffect(image);
    expect(image.apply).toHaveBeenCalledWith('scale_and_crop', expect.objectContaining({ width: 100, height: 100 }));
  });
});

describe('RotateImageEffect', () => {
  it('rotates the image by the configured degrees', () => {
    const logger = makeLogger();
    const effect = new RotateImageEffect({ degrees: 90, bgcolor: null, random: false }, 'image_rotate', def('image_rotate', 'Rotate'), logger);
    const image = mockImage(40, 20);
    effect.applyEffect(image);
    expect(image.rotate).toHaveBeenCalledWith(90, null);
  });

  it('swaps dimensions for a non-random 90-degree rotation', () => {
    const logger = makeLogger();
    const effect = new RotateImageEffect({ degrees: 90, bgcolor: null, random: false }, 'image_rotate', def('image_rotate', 'Rotate'), logger);
    const dims: Dimensions = { width: 40, height: 20 };
    effect.transformDimensions(dims, 'public://x.png');
    expect(dims).toEqual({ width: 20, height: 40 });
  });

  it('nulls dimensions for a random rotation', () => {
    const logger = makeLogger();
    const effect = new RotateImageEffect({ degrees: 45, bgcolor: null, random: true }, 'image_rotate', def('image_rotate', 'Rotate'), logger);
    const dims: Dimensions = { width: 40, height: 20 };
    effect.transformDimensions(dims, 'public://x.png');
    expect(dims).toEqual({ width: null, height: null });
  });
});

describe('DesaturateImageEffect', () => {
  it('desaturates the image', () => {
    const logger = makeLogger();
    const effect = new DesaturateImageEffect({}, 'image_desaturate', def('image_desaturate', 'Desaturate'), logger);
    const image = mockImage();
    expect(effect.applyEffect(image)).toBe(true);
    expect(image.desaturate).toHaveBeenCalledOnce();
  });
});

describe('ConvertImageEffect', () => {
  it('converts to the configured extension and reports the new derivative extension', () => {
    const logger = makeLogger();
    const effect = new ConvertImageEffect({ extension: 'jpg' }, 'image_convert', def('image_convert', 'Convert'), logger);
    const image = mockImage();
    effect.applyEffect(image);
    expect(image.convert).toHaveBeenCalledWith('jpg');
    expect(effect.getDerivativeExtension('png')).toBe('jpg');
  });
});
