import { describe, it, expect, vi } from 'vitest';
import { ResponsiveImageBuilder } from './responsive-image-builder.js';
import type {
  BreakpointInterface,
  Dimensions,
  ImageStyleMapping,
  ImageStyleResolverInterface,
  MimeTypeMapInterface,
  FileUrlGeneratorInterface,
} from './contracts.js';
import { EMPTY_IMAGE, EMPTY_IMAGE_DATA_URI } from './contracts.js';

function bp(mediaQuery: string): BreakpointInterface {
  return { getWeight: () => 0, getMediaQuery: () => mediaQuery };
}

/** A resolver that scales width/height by a per-style factor. */
function resolver(
  widths: Record<string, number>,
  extensions: Record<string, string> = {},
): ImageStyleResolverInterface {
  return {
    exists: (id) => id in widths,
    transformDimensions: vi.fn((id: string, _d: Dimensions, _uri: string): Dimensions => {
      const w = widths[id];
      return { width: w ?? null, height: w ?? null };
    }),
    getDerivativeExtension: (id, ext) => extensions[id] ?? ext,
    buildUrl: (id, path) => `/styles/${id}/${path}`,
  };
}

const mimeMap: MimeTypeMapInterface = {
  getMimeTypeForExtension: (ext) =>
    ({ jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' } as Record<string, string>)[ext] ??
    null,
};

const urlGen: FileUrlGeneratorInterface = {
  transformRelative: (u) => u,
  generateString: (u) => `/${u}`,
};

function makeBuilder(r: ImageStyleResolverInterface): ResponsiveImageBuilder {
  return new ResponsiveImageBuilder(r, mimeMap, urlGen);
}

describe('ResponsiveImageBuilder.getImageStyleUrl', () => {
  it('returns the data URI for the empty image style', () => {
    const b = makeBuilder(resolver({}));
    expect(b.getImageStyleUrl(EMPTY_IMAGE, 'public://x.jpeg')).toBe(EMPTY_IMAGE_DATA_URI);
  });

  it('builds a styled URL when the style exists', () => {
    const b = makeBuilder(resolver({ large: 480 }));
    expect(b.getImageStyleUrl('large', 'img.jpeg')).toBe('/styles/large/img.jpeg');
  });

  it('falls back to the raw path when the style is unknown', () => {
    const b = makeBuilder(resolver({}));
    expect(b.getImageStyleUrl('missing', 'img.jpeg')).toBe('/img.jpeg');
  });
});

describe('ResponsiveImageBuilder.getImageDimensions', () => {
  it('returns 1x1 for the empty image style', () => {
    const b = makeBuilder(resolver({}));
    expect(b.getImageDimensions(EMPTY_IMAGE, { width: 800, height: 600 }, 'x.jpeg')).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('delegates to the resolver transform for a real style', () => {
    const b = makeBuilder(resolver({ medium: 220 }));
    expect(b.getImageDimensions('medium', { width: 800, height: 600 }, 'x.jpeg')).toEqual({
      width: 220,
      height: 220,
    });
  });
});

describe('ResponsiveImageBuilder.getMimeType', () => {
  it('uses gif for the empty image', () => {
    const b = makeBuilder(resolver({}));
    expect(b.getMimeType(EMPTY_IMAGE, 'jpeg')).toBe('image/gif');
  });

  it('passes the original extension through for the original image', () => {
    const b = makeBuilder(resolver({}));
    expect(b.getMimeType('_original image_', 'webp')).toBe('image/webp');
  });

  it('uses the derivative extension for a normal style', () => {
    const b = makeBuilder(resolver({ large: 480 }, { large: 'webp' }));
    expect(b.getMimeType('large', 'jpeg')).toBe('image/webp');
  });
});

describe('ResponsiveImageBuilder.buildSourceAttributes', () => {
  it('builds an image_style source with srcset and media query', () => {
    const b = makeBuilder(resolver({ thumbnail: 100 }));
    const mapping: Record<string, ImageStyleMapping> = {
      '1x': {
        image_mapping_type: 'image_style',
        image_mapping: 'thumbnail',
        breakpoint_id: 'mobile',
        multiplier: '1x',
      },
    };
    const attrs = b.buildSourceAttributes(
      { uri: 'img.jpeg', width: 800, height: 600 },
      bp('(min-width: 0px)'),
      mapping,
    );
    expect(attrs.srcset).toBe('/styles/thumbnail/img.jpeg 1x');
    expect(attrs.media).toBe('(min-width: 0px)');
    expect(attrs.type).toBe('image/jpeg');
  });

  it('sorts multiple multipliers from small to large by multiplier', () => {
    const b = makeBuilder(resolver({ small: 100, big: 200 }));
    const mapping: Record<string, ImageStyleMapping> = {
      '2x': {
        image_mapping_type: 'image_style',
        image_mapping: 'big',
        breakpoint_id: 'mobile',
        multiplier: '2x',
      },
      '1x': {
        image_mapping_type: 'image_style',
        image_mapping: 'small',
        breakpoint_id: 'mobile',
        multiplier: '1x',
      },
    };
    const attrs = b.buildSourceAttributes(
      { uri: 'img.jpeg', width: 800, height: 600 },
      bp(''),
      mapping,
    );
    expect(attrs.srcset).toBe('/styles/small/img.jpeg 1x, /styles/big/img.jpeg 2x');
    // Empty media query -> no media attribute.
    expect(attrs.media).toBeUndefined();
  });

  it('builds a sizes source with width descriptors and the sizes attribute', () => {
    const b = makeBuilder(resolver({ large: 480, medium: 220 }));
    const mapping: Record<string, ImageStyleMapping> = {
      '1x': {
        image_mapping_type: 'sizes',
        image_mapping: {
          sizes: '(min-width: 700px) 700px, 100vw',
          sizes_image_styles: ['large', 'medium'],
        },
        breakpoint_id: 'narrow',
        multiplier: '1x',
      },
    };
    const attrs = b.buildSourceAttributes(
      { uri: 'img.jpeg', width: 800, height: 600 },
      bp('(min-width: 560px)'),
      mapping,
    );
    // Sorted small -> large by width descriptor.
    expect(attrs.srcset).toBe('/styles/medium/img.jpeg 220w, /styles/large/img.jpeg 480w');
    expect(attrs.sizes).toBe('(min-width: 700px) 700px, 100vw');
    expect(attrs.media).toBe('(min-width: 560px)');
  });

  it('omits the type attribute when MIME types differ within a source', () => {
    const b = makeBuilder(resolver({ a: 100, c: 200 }, { c: 'webp' }));
    const mapping: Record<string, ImageStyleMapping> = {
      '1x': {
        image_mapping_type: 'image_style',
        image_mapping: 'a',
        breakpoint_id: 'mobile',
        multiplier: '1x',
      },
      '2x': {
        image_mapping_type: 'image_style',
        image_mapping: 'c',
        breakpoint_id: 'mobile',
        multiplier: '2x',
      },
    };
    const attrs = b.buildSourceAttributes(
      { uri: 'img.jpeg', width: 800, height: 600 },
      bp(''),
      mapping,
    );
    expect(attrs.type).toBeUndefined();
  });

  it('throws when a sizes image style resolves to an undeterminable (null) width', () => {
    // A style that exists but whose transform yields a null width.
    const r: ImageStyleResolverInterface = {
      exists: () => true,
      transformDimensions: () => ({ width: null, height: null }),
      getDerivativeExtension: (_id, ext) => ext,
      buildUrl: (id, path) => `/styles/${id}/${path}`,
    };
    const b = makeBuilder(r);
    const mapping: Record<string, ImageStyleMapping> = {
      '1x': {
        image_mapping_type: 'sizes',
        image_mapping: { sizes: '100vw', sizes_image_styles: ['broken'] },
        breakpoint_id: 'narrow',
        multiplier: '1x',
      },
    };
    expect(() =>
      b.buildSourceAttributes({ uri: 'img.jpeg', width: 800, height: 600 }, bp(''), mapping),
    ).toThrow(/width/i);
  });
});
