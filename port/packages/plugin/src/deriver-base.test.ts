import { describe, it, expect } from 'vitest';
import { DeriverBase } from './deriver-base.js';
import type { PluginDefinition } from './types.js';

class NodeDeriver extends DeriverBase {
  override getDerivativeDefinitions(
    base: PluginDefinition,
  ): Record<string, PluginDefinition> {
    this.derivatives = {
      article: { ...base, label: 'Article' },
      page: { ...base, label: 'Page' },
    };
    return this.derivatives;
  }
}

describe('DeriverBase', () => {
  const base: PluginDefinition = { id: 'node', class: 'Node' };

  it('returns all derivative definitions', () => {
    const d = new NodeDeriver();
    expect(Object.keys(d.getDerivativeDefinitions(base)).sort()).toEqual([
      'article',
      'page',
    ]);
  });

  it('returns a single derivative definition, computing the set on demand', () => {
    const d = new NodeDeriver();
    expect(d.getDerivativeDefinition('article', base)?.label).toBe('Article');
  });

  it('returns null for an unknown derivative', () => {
    const d = new NodeDeriver();
    expect(d.getDerivativeDefinition('missing', base)).toBeNull();
  });
});
