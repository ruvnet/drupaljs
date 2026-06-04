import { describe, it, expect, beforeEach } from 'vitest';
import type { PluginDefinition } from '@drupaljs/plugin';
import { ModuleHandler } from '@drupaljs/hook';
import { BreakpointManager } from './breakpoint-manager.js';
import type { ThemeHandlerInterface } from './breakpoint-manager.js';
import { Breakpoint } from './breakpoint.js';

/**
 * Port of the relevant slice of
 * `Drupal\Tests\breakpoint\Kernel\BreakpointDiscoveryTest` +
 * `BreakpointManager` behaviour. Collaborators are mocked (London TDD): the
 * theme handler and module handler are tiny fakes, and breakpoint definitions
 * are supplied directly (the TS analog of YamlDiscovery) so we assert manager
 * behaviour — grouping, sorting, multiplier normalization, provider resolution.
 */

/** Raw breakpoint definitions as they would appear in *.breakpoints.yml. */
const themeBreakpoints: Record<string, PluginDefinition> = {
  'breakpoint_theme_test.mobile': {
    label: 'mobile',
    mediaQuery: '(min-width: 0px)',
    weight: 0,
    multipliers: ['1x'],
    provider: 'breakpoint_theme_test',
  },
  'breakpoint_theme_test.narrow': {
    label: 'narrow',
    mediaQuery: '(min-width: 560px)',
    weight: 1,
    multipliers: ['1x'],
    provider: 'breakpoint_theme_test',
  },
  // Intentionally out of order to test weight sorting.
  'breakpoint_theme_test.tv': {
    label: 'tv',
    mediaQuery: 'only screen and (min-width: 1220px)',
    weight: 3,
    multipliers: ['1x'],
    provider: 'breakpoint_theme_test',
  },
  'breakpoint_theme_test.wide': {
    label: 'wide',
    mediaQuery: '(min-width: 851px)',
    weight: 2,
    multipliers: ['1x'],
    provider: 'breakpoint_theme_test',
  },
  'breakpoint_theme_test.group2.narrow': {
    label: 'narrow',
    mediaQuery: '(min-width: 560px)',
    weight: 0,
    // Deliberately unsorted + missing 1x to test normalization.
    multipliers: ['2x'],
    provider: 'breakpoint_theme_test',
    group: 'breakpoint_theme_test.group2',
  },
  'breakpoint_theme_test.group2.wide': {
    label: 'wide',
    mediaQuery: '(min-width: 851px)',
    weight: 1,
    multipliers: ['1x', '2x'],
    provider: 'breakpoint_theme_test',
    group: 'breakpoint_theme_test.group2',
  },
};

function makeThemeHandler(themes: string[]): ThemeHandlerInterface {
  const set = new Set(themes);
  return {
    themeExists: (name) => set.has(name),
    getName: (name) => name,
  };
}

describe('BreakpointManager', () => {
  let moduleHandler: ModuleHandler;
  let manager: BreakpointManager;

  beforeEach(() => {
    moduleHandler = new ModuleHandler();
    moduleHandler.setModuleList({ breakpoint: { name: 'breakpoint' } });
    manager = new BreakpointManager(themeBreakpoints, {
      moduleHandler,
      themeHandler: makeThemeHandler(['breakpoint_theme_test']),
    });
  });

  it('defaults the group to the provider when no group is set', () => {
    const def = manager.getDefinition('breakpoint_theme_test.mobile');
    expect(def?.group).toBe('breakpoint_theme_test');
  });

  it('ensures a 1x multiplier always exists, sorted numerically', () => {
    const def = manager.getDefinition('breakpoint_theme_test.group2.narrow');
    expect(def?.multipliers).toEqual(['1x', '2x']);
  });

  it('does not duplicate an existing 1x multiplier', () => {
    const def = manager.getDefinition('breakpoint_theme_test.mobile');
    expect(def?.multipliers).toEqual(['1x']);
  });

  it('returns breakpoints for a group keyed by id and weight-ordered', () => {
    const breakpoints = manager.getBreakpointsByGroup('breakpoint_theme_test');
    expect(Object.keys(breakpoints)).toEqual([
      'breakpoint_theme_test.mobile',
      'breakpoint_theme_test.narrow',
      'breakpoint_theme_test.wide',
      'breakpoint_theme_test.tv',
    ]);
    expect(breakpoints['breakpoint_theme_test.mobile']).toBeInstanceOf(Breakpoint);
  });

  it('isolates breakpoints by group', () => {
    const group2 = manager.getBreakpointsByGroup('breakpoint_theme_test.group2');
    expect(Object.keys(group2)).toEqual([
      'breakpoint_theme_test.group2.narrow',
      'breakpoint_theme_test.group2.wide',
    ]);
  });

  it('returns instances implementing the BreakpointInterface accessors', () => {
    const breakpoints = manager.getBreakpointsByGroup('breakpoint_theme_test');
    const mobile = breakpoints['breakpoint_theme_test.mobile']!;
    expect(mobile.getLabel()).toBe('mobile');
    expect(mobile.getMediaQuery()).toBe('(min-width: 0px)');
    expect(mobile.getProvider()).toBe('breakpoint_theme_test');
  });

  it('caches and returns identical instances across calls', () => {
    const first = manager.getBreakpointsByGroup('breakpoint_theme_test');
    const second = manager.getBreakpointsByGroup('breakpoint_theme_test');
    expect(first['breakpoint_theme_test.mobile']).toBe(second['breakpoint_theme_test.mobile']);
  });

  it('lists groups sorted by label', () => {
    const groups = manager.getGroups();
    expect(Object.keys(groups)).toContain('breakpoint_theme_test');
    expect(Object.keys(groups)).toContain('breakpoint_theme_test.group2');
  });

  it('resolves group providers with their extension type', () => {
    const providers = manager.getGroupProviders('breakpoint_theme_test');
    expect(providers).toEqual({ breakpoint_theme_test: 'theme' });
  });

  it('resets caches on clearCachedDefinitions', () => {
    const before = manager.getBreakpointsByGroup('breakpoint_theme_test');
    manager.clearCachedDefinitions();
    const after = manager.getBreakpointsByGroup('breakpoint_theme_test');
    // New instances after a cache clear.
    expect(after['breakpoint_theme_test.mobile']).not.toBe(
      before['breakpoint_theme_test.mobile'],
    );
  });
});
