import { describe, it, expect } from 'vitest';
import { ToolbarHooks } from './ToolbarHooks.js';
import type { AccountInterface, RenderArray, ToolbarModuleHandler } from '../contracts.js';

const account = (perms: string[]): AccountInterface => ({
  hasPermission: (p) => perms.includes(p),
});

const moduleHandler = (existing: string[]): ToolbarModuleHandler => ({
  invokeAll: () => ({}),
  alter: () => {},
  moduleExists: (m) => existing.includes(m),
});

const make = (perms: string[], modules: string[] = []) =>
  new ToolbarHooks({
    currentUser: account(perms),
    moduleHandler: moduleHandler(modules),
    getSubtreesHash: () => 'thehash',
  });

describe('ToolbarHooks.help', () => {
  it('returns help markup for the toolbar help page', () => {
    const out = make([]).help('help.page.toolbar');
    expect(out).toContain('<h2>About</h2>');
    expect(out).toContain('Toolbar module');
  });

  it('returns null for other routes', () => {
    expect(make([]).help('help.page.node')).toBeNull();
  });
});

describe('ToolbarHooks.pageTop', () => {
  it('adds a toolbar render element gated on access toolbar permission', () => {
    const pageTop: RenderArray = {};
    make(['access toolbar']).pageTop(pageTop);
    const toolbar = pageTop['toolbar'] as RenderArray;
    expect(toolbar['#type']).toBe('toolbar');
    expect(toolbar['#access']).toBe(true);
    const cache = toolbar['#cache'] as RenderArray;
    expect((cache['contexts'] as string[])).toContain('user.permissions');
  });

  it('does NOT add the toolbar when navigation is enabled and accessible', () => {
    const pageTop: RenderArray = {};
    make(['access navigation', 'access toolbar'], ['navigation']).pageTop(pageTop);
    expect(pageTop['toolbar']).toBeUndefined();
  });
});

describe('ToolbarHooks.toolbar', () => {
  it('provides home and administration toolbar items with the subtrees hash', () => {
    const items = make(['access toolbar']).toolbar();
    expect(items['home']!['#type']).toBe('toolbar_item');
    expect(items['home']!['#weight']).toBe(-20);

    const admin = items['administration']!;
    expect(admin['#type']).toBe('toolbar_item');
    expect(admin['#weight']).toBe(-15);

    const tray = admin['tray'] as RenderArray;
    const attached = tray['#attached'] as RenderArray;
    const settings = attached['drupalSettings'] as RenderArray;
    const tb = settings['toolbar'] as RenderArray;
    expect(tb['subtreesHash']).toBe('thehash');
  });
});
