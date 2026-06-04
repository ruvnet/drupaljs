import { describe, it, expect } from 'vitest';
import { ToolbarItem } from './ToolbarItem.js';
import type { RenderArray } from '../contracts.js';

describe('ToolbarItem', () => {
  it('getInfo exposes the pre_render callback and a default tab', () => {
    const info = new ToolbarItem().getInfo();
    expect(info['#pre_render']).toEqual([[ToolbarItem, 'preRenderToolbarItem']]);
    expect((info['tab'] as RenderArray)['#type']).toBe('link');
  });

  it('preRenderToolbarItem marks a tray-less item as a plain toolbar-item', () => {
    const el: RenderArray = { '#id': 'toolbar-item-home', tab: { '#type': 'link' } };
    const out = ToolbarItem.preRenderToolbarItem(el);
    const tab = out['tab'] as RenderArray;
    const attrs = tab['#attributes'] as Record<string, unknown>;
    expect(attrs['id']).toBe('toolbar-item-home');
    expect(attrs['class']).toContain('toolbar-item');
    expect(attrs['class']).not.toContain('trigger');
  });

  it('preRenderToolbarItem wires up trigger + tray attributes when a tray is present', () => {
    const el: RenderArray = {
      '#id': 'toolbar-item-admin',
      tab: { '#type': 'link' },
      tray: { '#heading': 'Administration menu' },
    };
    const out = ToolbarItem.preRenderToolbarItem(el);
    const tab = out['tab'] as RenderArray;
    const tabAttrs = tab['#attributes'] as Record<string, unknown>;
    expect(tabAttrs['data-toolbar-tray']).toBe('toolbar-item-admin-tray');
    expect(tabAttrs['role']).toBe('button');
    expect(tabAttrs['aria-pressed']).toBe('false');
    expect(tabAttrs['class']).toContain('trigger');
    expect(tabAttrs['class']).toContain('toolbar-item');

    const tray = out['tray'] as RenderArray;
    const wrap = tray['#wrapper_attributes'] as Record<string, unknown>;
    expect(wrap['id']).toBe('toolbar-item-admin-tray');
    expect(wrap['class']).toContain('toolbar-tray');
  });
});
