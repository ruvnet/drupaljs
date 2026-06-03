import { describe, it, expect, beforeEach } from 'vitest';
import { FilterPluginManager } from './filter-plugin-manager.js';
import { FilterBase } from './filter-base.js';
import { FilterFormat } from './filter-format.js';
import { FilterProcessResult } from './filter-process-result.js';
import { FilterType, type HtmlRestrictions } from './types.js';

class TagFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text);
  }

  override getHtmlRestrictions(): HtmlRestrictions {
    return (this.settings.restrictions as HtmlRestrictions) ?? false;
  }
}

class NoopFilter extends FilterBase {
  process(text: string): FilterProcessResult {
    return new FilterProcessResult(text);
  }
}

function buildManager(): FilterPluginManager {
  const m = new FilterPluginManager();
  m.registerDefinition('tag', {
    id: 'tag',
    class: TagFilter,
    provider: 'filter',
    title: 'Tag',
    description: '',
    type: FilterType.HTML_RESTRICTOR,
    weight: 0,
    settings: {},
  });
  m.registerDefinition('noop', {
    id: 'noop',
    class: NoopFilter,
    provider: 'filter',
    title: 'Noop',
    description: '',
    type: FilterType.TRANSFORM_IRREVERSIBLE,
    weight: 0,
    settings: {},
  });
  return m;
}

describe('FilterFormat', () => {
  let manager: FilterPluginManager;

  beforeEach(() => {
    manager = buildManager();
  });

  it('exposes its id and label', () => {
    const fmt = new FilterFormat(
      { format: 'basic_html', name: 'Basic HTML', filters: {} },
      manager,
    );
    expect(fmt.id()).toBe('basic_html');
    expect(fmt.label()).toBe('Basic HTML');
  });

  it('filters() instantiates enabled filters sorted by weight then id', () => {
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          noop: { status: true, weight: 5 },
          tag: { status: true, weight: -10 },
        },
      },
      manager,
    );
    const ids = fmt.filters().map((f) => f.getPluginId());
    expect(ids).toEqual(['tag', 'noop']);
  });

  it('filters(instanceId) returns a single instance', () => {
    const fmt = new FilterFormat(
      { format: 'f', name: 'F', filters: { tag: { status: true } } },
      manager,
    );
    expect(fmt.filter('tag')?.getPluginId()).toBe('tag');
    expect(fmt.filter('missing')).toBeUndefined();
  });

  it('getFilterTypes lists distinct types of enabled filters only', () => {
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          tag: { status: true },
          noop: { status: false },
        },
      },
      manager,
    );
    expect(fmt.getFilterTypes()).toEqual([FilterType.HTML_RESTRICTOR]);
  });

  it('getHtmlRestrictions returns false when no restrictor applies', () => {
    const fmt = new FilterFormat(
      { format: 'f', name: 'F', filters: { noop: { status: true } } },
      manager,
    );
    expect(fmt.getHtmlRestrictions()).toBe(false);
  });

  it('getHtmlRestrictions intersects allowed tags across restrictor filters', () => {
    manager.registerDefinition('tag2', {
      id: 'tag2',
      class: TagFilter,
      provider: 'filter',
      title: 'Tag2',
      description: '',
      type: FilterType.HTML_RESTRICTOR,
      weight: 1,
      settings: {},
    });
    const fmt = new FilterFormat(
      {
        format: 'f',
        name: 'F',
        filters: {
          tag: {
            status: true,
            weight: 0,
            settings: { restrictions: { allowed: { a: true, p: false, em: false } } },
          },
          tag2: {
            status: true,
            weight: 1,
            settings: { restrictions: { allowed: { a: true, em: false } } },
          },
        },
      },
      manager,
    );
    const r = fmt.getHtmlRestrictions();
    if (r === false) throw new Error('expected restrictions');
    // p is dropped (not in tag2); a and em survive the intersection.
    expect(Object.keys(r.allowed).sort()).toEqual(['a', 'em']);
  });
});
