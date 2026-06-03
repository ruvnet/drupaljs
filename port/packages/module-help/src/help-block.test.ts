import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { buildHelpBlock, helpBlockCacheContexts } from './help-block.js';

function handler(): ModuleHandler {
  const h = new ModuleHandler();
  h.setModuleList({ help: { name: 'help' }, node: { name: 'node' } });
  return h;
}

describe('buildHelpBlock', () => {
  it('returns an empty array on a 403/404 (exception) page', () => {
    const h = handler();
    h.implement('help', 'help', () => 'should not show');
    expect(buildHelpBlock({ hasException: true, routeName: 'x' }, h)).toEqual([]);
  });

  it('wraps string hook_help results in #markup render arrays', () => {
    const h = handler();
    h.implement('help', 'help', (route: string) =>
      route === 'entity.node.canonical' ? 'Node help' : null,
    );
    const build = buildHelpBlock(
      { hasException: false, routeName: 'entity.node.canonical' },
      h,
    );
    expect(build).toEqual([{ '#markup': 'Node help' }]);
  });

  it('passes through array (render-array) results unchanged', () => {
    const h = handler();
    h.implement('help', 'help', () => ({ '#markup': 'array help', '#weight': 1 }));
    const build = buildHelpBlock({ hasException: false, routeName: 'r' }, h);
    expect(build).toEqual([{ '#markup': 'array help', '#weight': 1 }]);
  });

  it('omits empty / null hook_help results', () => {
    const h = handler();
    h.implement('help', 'help', () => null);
    h.implement('node', 'help', () => '');
    expect(buildHelpBlock({ hasException: false, routeName: 'r' }, h)).toEqual([]);
  });

  it('collects help from every implementing module', () => {
    const h = handler();
    h.implement('help', 'help', () => 'A');
    h.implement('node', 'help', () => 'B');
    const build = buildHelpBlock({ hasException: false, routeName: 'r' }, h);
    expect(build).toEqual([{ '#markup': 'A' }, { '#markup': 'B' }]);
  });
});

describe('helpBlockCacheContexts', () => {
  it('always includes the route context', () => {
    expect(helpBlockCacheContexts()).toContain('route');
  });

  it('merges with parent contexts without duplicating route', () => {
    expect(helpBlockCacheContexts(['user', 'route'])).toEqual(['user', 'route']);
  });
});
