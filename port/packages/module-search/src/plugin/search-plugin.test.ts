import { describe, it, expect } from 'vitest';
import {
  SearchPluginBase,
  SearchPluginManager,
  type SearchResult,
  type SearchPluginDefinition,
} from './search-plugin.js';

/** A concrete test plugin exercising the abstract base. */
class FakeSearch extends SearchPluginBase {
  static readonly PLUGIN_ID = 'fake_search';
  getType(): string | null {
    return 'fake_search';
  }
  execute(): SearchResult[] {
    if (!this.isSearchExecutable()) return [];
    return [{ link: '/a', title: `hit:${this.getKeywords()}` }];
  }
}

const fakeDefinition: SearchPluginDefinition = {
  id: 'fake_search',
  title: 'Fake search',
  factory: (config, pluginId) => new FakeSearch(config, pluginId, fakeDefinition),
};

describe('SearchPluginBase', () => {
  it('stores keywords, parameters and attributes via setSearch (chainable)', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    const ret = p.setSearch('hello', { page: '0' }, { foo: 'bar' });
    expect(ret).toBe(p);
    expect(p.getKeywords()).toBe('hello');
    expect(p.getParameters()).toEqual({ page: '0' });
    expect(p.getAttributes()).toEqual({ foo: 'bar' });
  });

  it('coerces keywords to a string', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    p.setSearch(42 as unknown as string, {}, {});
    expect(p.getKeywords()).toBe('42');
  });

  it('isSearchExecutable is false without keywords and true with them', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    expect(p.isSearchExecutable()).toBe(false);
    p.setSearch('term', {}, {});
    expect(p.isSearchExecutable()).toBe(true);
  });

  it('exposes its plugin id and definition', () => {
    const p = new FakeSearch({ a: 1 }, 'fake_search', fakeDefinition);
    expect(p.getPluginId()).toBe('fake_search');
    expect(p.getPluginDefinition()).toBe(fakeDefinition);
    expect(p.getConfiguration()).toEqual({ a: 1 });
  });

  it('buildResults wraps execute() results in render arrays', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    p.setSearch('x', {}, {});
    expect(p.buildResults()).toEqual([
      { '#theme': 'search_result', '#result': { link: '/a', title: 'hit:x' }, '#plugin_id': 'fake_search' },
    ]);
  });

  it('suggestedTitle includes the keywords, default Search otherwise', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    expect(p.suggestedTitle()).toBe('Search');
    p.setSearch('drupal', {}, {});
    expect(p.suggestedTitle()).toBe('Search for drupal');
  });

  it('usesAdminTheme reflects the definition flag (default false)', () => {
    const p = new FakeSearch({}, 'fake_search', fakeDefinition);
    expect(p.usesAdminTheme()).toBe(false);
    const adminDef = { ...fakeDefinition, use_admin_theme: true };
    const p2 = new FakeSearch({}, 'fake_search', adminDef);
    expect(p2.usesAdminTheme()).toBe(true);
  });
});

describe('SearchPluginManager', () => {
  it('registers and reports plugin definitions', () => {
    const mgr = new SearchPluginManager();
    mgr.registerDefinition(fakeDefinition);
    expect(mgr.hasDefinition('fake_search')).toBe(true);
    expect(mgr.getDefinitions()).toHaveProperty('fake_search');
    expect(mgr.getDefinition('fake_search')).toBe(fakeDefinition);
  });

  it('creates an instance from a registered definition with config', () => {
    const mgr = new SearchPluginManager();
    mgr.registerDefinition(fakeDefinition);
    const instance = mgr.createInstance('fake_search', { weight: 5 });
    expect(instance).toBeInstanceOf(FakeSearch);
    expect(instance.getConfiguration()).toEqual({ weight: 5 });
  });

  it('throws for an unknown plugin id', () => {
    const mgr = new SearchPluginManager();
    expect(() => mgr.createInstance('nope')).toThrow(/nope/);
    expect(() => mgr.getDefinition('nope')).toThrow(/nope/);
  });
});
