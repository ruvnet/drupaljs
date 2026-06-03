import { describe, it, expect, beforeEach } from 'vitest';
import type { PluginDefinition } from '@drupaljs/plugin';
import { FilterPluginManager } from './filter-plugin-manager.js';
import { FilterBase } from './filter-base.js';
import { FilterProcessResult } from './filter-process-result.js';
import { FilterType, type FilterInterface } from './types.js';

class UpperFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text.toUpperCase());
  }
}

class NullFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text);
  }
}

describe('FilterPluginManager', () => {
  let manager: FilterPluginManager;

  beforeEach(() => {
    manager = new FilterPluginManager();
    manager.registerDefinition('filter_upper', {
      id: 'filter_upper',
      class: UpperFilter,
      provider: 'test',
      title: 'Upper',
      description: '',
      type: FilterType.TRANSFORM_IRREVERSIBLE,
      weight: 0,
      settings: {},
    });
    manager.registerDefinition('filter_null', {
      id: 'filter_null',
      class: NullFilter,
      provider: 'filter',
      title: 'Null',
      description: '',
      type: FilterType.TRANSFORM_IRREVERSIBLE,
      weight: 0,
      settings: {},
    });
  });

  it('lists and looks up registered definitions', () => {
    expect(manager.hasDefinition('filter_upper')).toBe(true);
    expect(Object.keys(manager.getDefinitions()).sort()).toEqual([
      'filter_null',
      'filter_upper',
    ]);
  });

  it('createInstance returns a configured FilterInterface', () => {
    const f = manager.createInstance('filter_upper', {
      status: true,
      weight: 2,
    }) as FilterInterface;
    expect(f.getPluginId()).toBe('filter_upper');
    expect(f.status).toBe(true);
    expect(f.getType()).toBe(FilterType.TRANSFORM_IRREVERSIBLE);
    expect(f.process('hi', 'en').getProcessedText()).toBe('HI');
  });

  it('getFallbackPluginId is filter_null', () => {
    expect(manager.getFallbackPluginId('missing')).toBe('filter_null');
  });

  it('createInstance of an unknown plugin throws', () => {
    expect(() => manager.createInstance('nope')).toThrow();
  });
});
