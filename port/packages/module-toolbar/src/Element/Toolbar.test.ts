import { describe, it, expect, vi } from 'vitest';
import { Toolbar } from './Toolbar.js';
import type { RenderArray, ToolbarModuleHandler } from '../contracts.js';

describe('Toolbar', () => {
  it('getInfo declares the toolbar theme, library and pre_render callback', () => {
    const info = new Toolbar().getInfo();
    expect(info['#theme']).toBe('toolbar');
    expect(info['#pre_render']).toEqual([[Toolbar, 'preRenderToolbar']]);
    const attached = info['#attached'] as RenderArray;
    expect((attached['library'] as string[])).toContain('toolbar/toolbar');
  });

  it('preRenderToolbar collects, alters, weight-sorts hook_toolbar items and assigns ids', () => {
    const items: Record<string, RenderArray> = {
      home: { '#type': 'toolbar_item', '#weight': -20 },
      administration: { '#type': 'toolbar_item', '#weight': -15 },
    };
    const handler: ToolbarModuleHandler = {
      invokeAll: vi.fn(() => items),
      alter: vi.fn(),
      moduleExists: () => false,
    };

    const element: RenderArray = { '#theme': 'toolbar', '#attributes': { id: 'toolbar-administration' } };
    const out = Toolbar.preRenderToolbar(element, handler);

    expect(handler.invokeAll).toHaveBeenCalledWith('toolbar');
    expect(handler.alter).toHaveBeenCalledWith('toolbar', items);

    // Merged children present with generated #id values.
    expect((out['home'] as RenderArray)['#id']).toBe('toolbar-item-home');
    expect((out['administration'] as RenderArray)['#id']).toBe('toolbar-item-administration');

    // Children ordered by ascending #weight (home -20 before administration -15).
    const childKeys = Object.keys(out).filter((k) => !k.startsWith('#'));
    expect(childKeys).toEqual(['home', 'administration']);
  });

  it('preRenderToolbar reorders items by weight regardless of insertion order', () => {
    const items: Record<string, RenderArray> = {
      late: { '#weight': 5 },
      early: { '#weight': -5 },
    };
    const handler: ToolbarModuleHandler = {
      invokeAll: () => items,
      alter: () => {},
      moduleExists: () => false,
    };
    const out = Toolbar.preRenderToolbar({}, handler);
    const childKeys = Object.keys(out).filter((k) => !k.startsWith('#'));
    expect(childKeys).toEqual(['early', 'late']);
  });
});
