import { describe, it, expect } from 'vitest';
import type { PluginDefinition } from '@drupaljs/plugin';
import { FilterBase } from './filter-base.js';
import { FilterProcessResult } from './filter-process-result.js';
import { FilterType } from './types.js';

class PassthroughFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text);
  }
}

const def: PluginDefinition = {
  id: 'passthrough',
  provider: 'test',
  title: 'Passthrough',
  description: 'Does nothing.',
  type: FilterType.TRANSFORM_IRREVERSIBLE,
  weight: 7,
  settings: { foo: 'bar' },
};

function make(config: Record<string, unknown> = {}): PassthroughFilter {
  return new PassthroughFilter(config, 'passthrough', def);
}

describe('FilterBase', () => {
  it('reads label/description/type/provider from the definition', () => {
    const f = make();
    expect(f.getLabel()).toBe('Passthrough');
    expect(f.getDescription()).toBe('Does nothing.');
    expect(f.getType()).toBe(FilterType.TRANSFORM_IRREVERSIBLE);
    expect(f.provider).toBe('test');
    expect(f.getPluginId()).toBe('passthrough');
  });

  it('applies status/weight/settings from constructor configuration', () => {
    const f = make({ status: true, weight: 3, settings: { a: 1 } });
    expect(f.status).toBe(true);
    expect(f.weight).toBe(3);
    expect(f.settings).toEqual({ a: 1 });
  });

  it('defaults: disabled, weight 0, empty settings', () => {
    const f = make();
    expect(f.status).toBe(false);
    expect(f.weight).toBe(0);
    expect(f.settings).toEqual({});
  });

  it('coerces configuration types (truthy status, numeric weight)', () => {
    const f = make({ status: 1, weight: '5' });
    expect(f.status).toBe(true);
    expect(f.weight).toBe(5);
  });

  it('getConfiguration round-trips the canonical shape', () => {
    const f = make({ status: true, weight: 2, settings: { x: 9 } });
    expect(f.getConfiguration()).toEqual({
      id: 'passthrough',
      provider: 'test',
      status: true,
      weight: 2,
      settings: { x: 9 },
    });
  });

  it('setConfiguration is chainable and merges partials', () => {
    const f = make();
    const ret = f.setConfiguration({ status: true });
    expect(ret).toBe(f);
    expect(f.status).toBe(true);
    expect(f.weight).toBe(0);
  });

  it('prepare() defaults to identity', () => {
    expect(make().prepare('<x>', 'en')).toBe('<x>');
  });

  it('getHtmlRestrictions() defaults to false and tips() to null', () => {
    const f = make();
    expect(f.getHtmlRestrictions()).toBe(false);
    expect(f.tips()).toBeNull();
  });
});
