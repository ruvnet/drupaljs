import { describe, it, expect } from 'vitest';
import { SearchPage } from './search-page.js';
import { SearchPluginManager } from '../plugin/search-plugin.js';
import { SearchPluginBase, type SearchResult, type SearchPluginDefinition } from '../plugin/search-plugin.js';

class IndexingSearch extends SearchPluginBase {
  getType(): string | null {
    return 'indexing';
  }
  execute(): SearchResult[] {
    return [];
  }
  updateIndex(): void {
    /* indexable */
  }
}

const indexingDef: SearchPluginDefinition = {
  id: 'indexing_search',
  title: 'Indexing search',
  factory: (c, id) => new IndexingSearch(c, id, indexingDef),
};

function makeManager(): SearchPluginManager {
  const m = new SearchPluginManager();
  m.registerDefinition(indexingDef);
  return m;
}

describe('SearchPage config entity', () => {
  it('exposes id, label, path, weight and plugin id', () => {
    const page = new SearchPage(
      { id: 'node_search', label: 'Content', path: 'node', weight: 0, plugin: 'indexing_search' },
      makeManager(),
    );
    expect(page.id()).toBe('node_search');
    expect(page.label()).toBe('Content');
    expect(page.getPath()).toBe('node');
    expect(page.getWeight()).toBe(0);
    expect(page.getPluginId()).toBe('indexing_search');
  });

  it('status() reflects the enabled flag and defaults to true', () => {
    const enabled = new SearchPage({ id: 'a', plugin: 'indexing_search' }, makeManager());
    expect(enabled.status()).toBe(true);
    const disabled = new SearchPage({ id: 'b', plugin: 'indexing_search', status: false }, makeManager());
    expect(disabled.status()).toBe(false);
  });

  it('getPlugin lazily creates the plugin instance with the page configuration', () => {
    const page = new SearchPage(
      { id: 'node_search', plugin: 'indexing_search', configuration: { rankings: { keyword: 1 } } },
      makeManager(),
    );
    const plugin = page.getPlugin();
    expect(plugin).toBeInstanceOf(IndexingSearch);
    expect(plugin.getConfiguration()).toEqual({ rankings: { keyword: 1 } });
    // Lazy + memoised: same instance returned.
    expect(page.getPlugin()).toBe(plugin);
  });

  it('setPlugin swaps the plugin id and resets the collection', () => {
    const mgr = makeManager();
    mgr.registerDefinition({ ...indexingDef, id: 'other', factory: indexingDef.factory });
    const page = new SearchPage({ id: 'p', plugin: 'indexing_search' }, mgr);
    page.setPlugin('other');
    expect(page.getPluginId()).toBe('other');
  });

  it('isIndexable is true for an enabled page whose plugin implements indexing', () => {
    const page = new SearchPage({ id: 'p', plugin: 'indexing_search', status: true }, makeManager());
    expect(page.isIndexable()).toBe(true);
  });

  it('isIndexable is false when the page is disabled', () => {
    const page = new SearchPage({ id: 'p', plugin: 'indexing_search', status: false }, makeManager());
    expect(page.isIndexable()).toBe(false);
  });

  it('toConfigArray exports only config_export keys', () => {
    const page = new SearchPage(
      { id: 'node_search', label: 'Content', path: 'node', weight: -10, plugin: 'indexing_search', configuration: {} },
      makeManager(),
    );
    expect(page.toConfigArray()).toEqual({
      id: 'node_search',
      label: 'Content',
      path: 'node',
      weight: -10,
      plugin: 'indexing_search',
      configuration: {},
    });
  });

  it('sort orders enabled pages before disabled, then by weight, then label', () => {
    const mgr = makeManager();
    const a = new SearchPage({ id: 'a', label: 'A', weight: 0, status: false, plugin: 'indexing_search' }, mgr);
    const b = new SearchPage({ id: 'b', label: 'B', weight: 5, status: true, plugin: 'indexing_search' }, mgr);
    const c = new SearchPage({ id: 'c', label: 'C', weight: 0, status: true, plugin: 'indexing_search' }, mgr);
    const sorted = [a, b, c].sort(SearchPage.sort);
    expect(sorted.map((p) => p.id())).toEqual(['c', 'b', 'a']);
  });
});
