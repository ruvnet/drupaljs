import { describe, it, expect } from 'vitest';
import type { PluginDefinition } from '@drupaljs/plugin';
import { Breakpoint } from './breakpoint.js';
import type { BreakpointInterface } from './breakpoint-interface.js';

/**
 * Port of `Drupal\Tests\breakpoint\Unit\BreakpointTest` (condensed): the plugin
 * is a thin typed accessor over its definition, so we assert each getter
 * surfaces the corresponding definition key.
 */
function makeDefinition(overrides: Partial<PluginDefinition> = {}): PluginDefinition {
  return {
    id: 'test.mobile',
    label: 'Mobile',
    mediaQuery: '(min-width: 0px)',
    weight: 0,
    multipliers: ['1x'],
    group: 'test',
    provider: 'test',
    ...overrides,
  };
}

describe('Breakpoint', () => {
  it('is a BreakpointInterface', () => {
    const bp: BreakpointInterface = new Breakpoint({}, 'test.mobile', makeDefinition());
    expect(bp).toBeInstanceOf(Breakpoint);
  });

  it('returns the label', () => {
    const bp = new Breakpoint({}, 'test.mobile', makeDefinition({ label: 'Large' }));
    expect(bp.getLabel()).toBe('Large');
  });

  it('coerces weight to an integer', () => {
    const bp = new Breakpoint({}, 'test.mobile', makeDefinition({ weight: '2' as unknown as number }));
    expect(bp.getWeight()).toBe(2);
    expect(Number.isInteger(bp.getWeight())).toBe(true);
  });

  it('returns the media query', () => {
    const bp = new Breakpoint(
      {},
      'test.lg',
      makeDefinition({ mediaQuery: 'all and (min-width: 1000px)' }),
    );
    expect(bp.getMediaQuery()).toBe('all and (min-width: 1000px)');
  });

  it('returns the multipliers', () => {
    const bp = new Breakpoint({}, 'test.lg', makeDefinition({ multipliers: ['1x', '2x'] }));
    expect(bp.getMultipliers()).toEqual(['1x', '2x']);
  });

  it('returns the provider', () => {
    const bp = new Breakpoint({}, 'test.lg', makeDefinition({ provider: 'olivero' }));
    expect(bp.getProvider()).toBe('olivero');
  });

  it('returns the group', () => {
    const bp = new Breakpoint({}, 'test.lg', makeDefinition({ group: 'olivero.group2' }));
    expect(bp.getGroup()).toBe('olivero.group2');
  });

  it('exposes its plugin id (PluginBase)', () => {
    const bp = new Breakpoint({}, 'test.mobile', makeDefinition());
    expect(bp.getPluginId()).toBe('test.mobile');
  });
});
