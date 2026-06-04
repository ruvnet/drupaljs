import { describe, it, expect } from 'vitest';
import { ContextualHooks } from './ContextualHooks.js';
import type { AccountLike } from '../contracts.js';

function account(perms: string[]): AccountLike {
  return { hasPermission: (p: string) => perms.includes(p) };
}

describe('ContextualHooks.toolbar', () => {
  it('returns only the permission cache context when access is denied', () => {
    const hooks = new ContextualHooks(account([]));
    const contextual = hooks.toolbar().contextual!;
    expect(contextual).toEqual({ '#cache': { contexts: ['user.permissions'] } });
    expect(contextual['#type']).toBeUndefined();
  });

  it('adds the Edit toolbar item + library when access is granted', () => {
    const hooks = new ContextualHooks(account(['access contextual links']));
    const contextual = hooks.toolbar().contextual!;
    expect(contextual['#type']).toBe('toolbar_item');
    expect(contextual['#attached']).toEqual({
      library: ['contextual/drupal.contextual-toolbar'],
    });
    // Cache context is preserved.
    expect(contextual['#cache']).toEqual({ contexts: ['user.permissions'] });
  });
});

describe('ContextualHooks.pageAttachments', () => {
  it('does not attach the library without permission', () => {
    const hooks = new ContextualHooks(account([]));
    const page: Record<string, any> = {};
    hooks.pageAttachments(page);
    expect(page['#attached']).toBeUndefined();
  });

  it('attaches the contextual-links library with permission', () => {
    const hooks = new ContextualHooks(account(['access contextual links']));
    const page: Record<string, any> = {};
    hooks.pageAttachments(page);
    expect(page['#attached'].library).toContain('contextual/drupal.contextual-links');
  });
});

describe('ContextualHooks.help', () => {
  it('returns help markup for help.page.contextual', () => {
    const hooks = new ContextualHooks(account([]));
    const out = hooks.help('help.page.contextual');
    expect(out).toContain('About');
    expect(out).toContain('Use contextual links');
  });

  it('returns null for unrelated routes', () => {
    const hooks = new ContextualHooks(account([]));
    expect(hooks.help('node.view')).toBeNull();
  });
});

describe('ContextualHooks.contextualLinksViewAlter', () => {
  it('replaces #links from encoded views-field metadata', () => {
    const hooks = new ContextualHooks(account([]));
    const encoded = encodeURIComponent(JSON.stringify([{ title: 'Edit', url: '/edit' }]));
    const element: Record<string, any> = {
      '#contextual_links': {
        contextual: { metadata: { 'contextual-views-field-links': encoded } },
      },
      '#links': {},
    };
    hooks.contextualLinksViewAlter(element, {});
    expect(element['#links']).toEqual([{ title: 'Edit', url: '/edit' }]);
  });

  it('leaves the element untouched without a contextual group', () => {
    const hooks = new ContextualHooks(account([]));
    const element: Record<string, any> = { '#contextual_links': {}, '#links': { a: 1 } };
    hooks.contextualLinksViewAlter(element, {});
    expect(element['#links']).toEqual({ a: 1 });
  });
});
