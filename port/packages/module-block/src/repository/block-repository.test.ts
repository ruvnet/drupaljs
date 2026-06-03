import { describe, it, expect, vi } from 'vitest';
import { BlockRepository } from './block-repository.js';
import { Block } from '../entity/block.js';
import type { BlockPluginManager } from '../plugin/block-plugin.js';

const manager: BlockPluginManager = {
  createInstance: () => ({
    pluginId: 'p',
    getConfiguration: () => ({}),
    setConfiguration: vi.fn(),
    getPluginDefinition: () => ({ id: 'p', admin_label: 'P' }),
    label: () => 'P',
  }),
};

function block(id: string, region: string, weight: number, status = true, access = true) {
  const b = new Block({ id, theme: 'stark', region, weight, plugin: 'p', status, settings: { label: id } }, manager);
  // Stub access used by the repository's visibility check.
  b.access = vi.fn(() => access);
  return b;
}

describe('BlockRepository.getVisibleBlocksPerRegion', () => {
  it('groups accessible blocks by region in active-theme region order, sorted within a region', () => {
    const themeManager = {
      getActiveTheme: () => ({ getName: () => 'stark', getRegions: () => ['header', 'content', 'footer'] }),
    };
    const storage = {
      loadByProperties: vi.fn(() => ({
        b_footer: block('b_footer', 'footer', 0),
        b_header_low: block('b_header_low', 'header', 5),
        b_header_high: block('b_header_high', 'header', -5),
      })),
    };

    const repo = new BlockRepository(storage, themeManager);
    const result = repo.getVisibleBlocksPerRegion();

    // Empty regions are preserved, and region key order matches the theme.
    expect(Object.keys(result)).toEqual(['header', 'content', 'footer']);
    expect(result.content).toEqual({});
    // Within header, lower weight comes first.
    expect(Object.keys(result.header!)).toEqual(['b_header_high', 'b_header_low']);
    expect(Object.keys(result.footer!)).toEqual(['b_footer']);
  });

  it('only queries blocks for the active theme', () => {
    const storage = { loadByProperties: vi.fn(() => ({})) };
    const themeManager = {
      getActiveTheme: () => ({ getName: () => 'olivero', getRegions: () => ['content'] }),
    };
    new BlockRepository(storage, themeManager).getVisibleBlocksPerRegion();
    expect(storage.loadByProperties).toHaveBeenCalledWith({ theme: 'olivero' });
  });

  it('excludes blocks whose access check denies view', () => {
    const storage = {
      loadByProperties: () => ({
        denied: block('denied', 'content', 0, true, false),
        allowed: block('allowed', 'content', 0, true, true),
      }),
    };
    const themeManager = { getActiveTheme: () => ({ getName: () => 'stark', getRegions: () => ['content'] }) };
    const result = new BlockRepository(storage, themeManager).getVisibleBlocksPerRegion();
    expect(Object.keys(result.content!)).toEqual(['allowed']);
  });
});

describe('BlockRepository.getUniqueMachineName', () => {
  it('prefixes the theme and returns the suggestion when unused', () => {
    const storage = { getExistingIds: vi.fn(() => []) };
    const themeManager = { getActiveTheme: () => ({ getName: () => 'stark', getRegions: () => [] }) };
    const repo = new BlockRepository(storage as never, themeManager);
    expect(repo.getUniqueMachineName('powered', 'stark')).toBe('stark_powered');
  });

  it('appends an incrementing suffix until the name is free', () => {
    const storage = { getExistingIds: () => ['stark_powered', 'stark_powered_2'] };
    const themeManager = { getActiveTheme: () => ({ getName: () => 'stark', getRegions: () => [] }) };
    const repo = new BlockRepository(storage as never, themeManager);
    expect(repo.getUniqueMachineName('powered', 'stark')).toBe('stark_powered_3');
  });
});
