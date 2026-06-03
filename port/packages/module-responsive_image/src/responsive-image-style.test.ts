import { describe, it, expect, vi } from 'vitest';
import { ResponsiveImageStyle } from './responsive-image-style.js';
import type {
  BreakpointInterface,
  BreakpointManagerInterface,
  ImageStyleMapping,
} from './contracts.js';
import { EMPTY_IMAGE, ORIGINAL_IMAGE } from './contracts.js';

/** Build a mock breakpoint with a given weight. */
function bp(weight: number, mediaQuery = ''): BreakpointInterface {
  return { getWeight: () => weight, getMediaQuery: () => mediaQuery };
}

/** A breakpoint manager mock returning the supplied group map. */
function manager(
  byGroup: Record<string, Record<string, BreakpointInterface>> = {},
  providers: Record<string, Record<string, string>> = {},
): BreakpointManagerInterface {
  return {
    getBreakpointsByGroup: vi.fn((g: string) => byGroup[g] ?? {}),
    getGroupProviders: vi.fn((g: string) => providers[g] ?? {}),
  };
}

describe('ResponsiveImageStyle (config entity)', () => {
  it('exposes id, label, and getters', () => {
    const style = new ResponsiveImageStyle(
      { id: 'wide', label: 'Wide' },
      manager(),
    );
    expect(style.id).toBe('wide');
    expect(style.label).toBe('Wide');
    expect(style.getBreakpointGroup()).toBe('');
    expect(style.getFallbackImageStyle()).toBe('');
    expect(style.hasImageStyleMappings()).toBe(false);
  });

  it('setBreakpointGroup / setFallbackImageStyle are chainable', () => {
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, manager());
    expect(style.setBreakpointGroup('grp')).toBe(style);
    expect(style.getBreakpointGroup()).toBe('grp');
    expect(style.setFallbackImageStyle('thumbnail')).toBe(style);
    expect(style.getFallbackImageStyle()).toBe('thumbnail');
  });

  it('clears mappings when the breakpoint group changes', () => {
    const m = manager({ grp: { mobile: bp(0) } });
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m);
    style.setBreakpointGroup('grp');
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'thumbnail',
    });
    expect(style.hasImageStyleMappings()).toBe(true);
    style.setBreakpointGroup('other');
    expect(style.hasImageStyleMappings()).toBe(false);
    expect(style.getImageStyleMappings()).toEqual([]);
  });

  it('adds a mapping and exposes it keyed by breakpoint then multiplier', () => {
    const m = manager({ grp: { mobile: bp(0) } });
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m)
      .setBreakpointGroup('grp');
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'thumbnail',
    });
    const keyed = style.getKeyedImageStyleMappings();
    expect(keyed.mobile?.['1x']?.image_mapping).toBe('thumbnail');
    expect(style.getImageStyleMapping('mobile', '1x')?.image_mapping).toBe('thumbnail');
    expect(style.getImageStyleMapping('mobile', '2x')).toBeUndefined();
  });

  it('overwrites an existing mapping for the same breakpoint+multiplier', () => {
    const m = manager({ grp: { mobile: bp(0) } });
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m)
      .setBreakpointGroup('grp');
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'thumbnail',
    });
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'large',
    });
    expect(style.getImageStyleMappings()).toHaveLength(1);
    expect(style.getImageStyleMapping('mobile', '1x')?.image_mapping).toBe('large');
  });

  it('isEmptyImageStyleMapping detects empty image_style and sizes mappings', () => {
    expect(ResponsiveImageStyle.isEmptyImageStyleMapping({} as ImageStyleMapping)).toBe(true);
    expect(
      ResponsiveImageStyle.isEmptyImageStyleMapping({
        image_mapping_type: 'image_style',
        image_mapping: '',
      } as ImageStyleMapping),
    ).toBe(true);
    expect(
      ResponsiveImageStyle.isEmptyImageStyleMapping({
        image_mapping_type: 'image_style',
        image_mapping: 'thumbnail',
      } as ImageStyleMapping),
    ).toBe(false);
    expect(
      ResponsiveImageStyle.isEmptyImageStyleMapping({
        image_mapping_type: 'sizes',
        image_mapping: { sizes: '100vw', sizes_image_styles: ['large'] },
      } as ImageStyleMapping),
    ).toBe(false);
    expect(
      ResponsiveImageStyle.isEmptyImageStyleMapping({
        image_mapping_type: 'sizes',
        image_mapping: { sizes: '', sizes_image_styles: [] },
      } as unknown as ImageStyleMapping),
    ).toBe(true);
  });

  it('getImageStyleIds collects fallback + image_style + sizes styles, unique & filtered', () => {
    const m = manager({ grp: { mobile: bp(0), narrow: bp(1) } });
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m)
      .setBreakpointGroup('grp')
      .setFallbackImageStyle('fallback');
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'thumbnail',
    });
    style.addImageStyleMapping('narrow', '1x', {
      image_mapping_type: 'sizes',
      image_mapping: { sizes: '100vw', sizes_image_styles: ['large', 'medium', 'thumbnail'] },
    });
    expect(style.getImageStyleIds().sort()).toEqual(
      ['fallback', 'large', 'medium', 'thumbnail'].sort(),
    );
  });

  it('sorts mappings by breakpoint weight (desc) then multiplier', () => {
    // mobile weight 0, narrow weight 1 -> narrow first (higher weight).
    const m = manager({ grp: { mobile: bp(0), narrow: bp(1) } });
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m)
      .setBreakpointGroup('grp');
    style.addImageStyleMapping('mobile', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'thumbnail',
    });
    style.addImageStyleMapping('narrow', '1x', {
      image_mapping_type: 'image_style',
      image_mapping: 'large',
    });
    const order = style.getImageStyleMappings().map((m2) => m2.breakpoint_id);
    expect(order[0]).toBe('narrow');
  });

  it('calculateDependencies adds group providers and image-style config deps', () => {
    const m = manager(
      { grp: { mobile: bp(0) } },
      { grp: { my_theme: 'theme' } },
    );
    const style = new ResponsiveImageStyle({ id: 'a', label: 'A' }, m)
      .setBreakpointGroup('grp')
      .setFallbackImageStyle('fallback');
    const deps = style.calculateDependencies();
    expect(deps.theme).toContain('my_theme');
    expect(deps.config).toContain('image.style.fallback');
  });

  it('exposes EMPTY_IMAGE and ORIGINAL_IMAGE constants', () => {
    expect(ResponsiveImageStyle.EMPTY_IMAGE).toBe(EMPTY_IMAGE);
    expect(ResponsiveImageStyle.ORIGINAL_IMAGE).toBe(ORIGINAL_IMAGE);
  });
});
