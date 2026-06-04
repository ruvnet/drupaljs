import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerContextualHooks, MODULE_NAME } from './register.js';
import { ContextualHooks } from './ContextualHooks.js';
import type { AccountLike, RenderArray } from '../contracts.js';

function account(perms: string[]): AccountLike {
  return { hasPermission: (p: string) => perms.includes(p) };
}

function setup(perms: string[]) {
  const handler = new ModuleHandler();
  handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
  registerContextualHooks(handler, new ContextualHooks(account(perms)));
  return handler;
}

describe('registerContextualHooks', () => {
  it('registers all four contextual hooks on the module handler', () => {
    const handler = setup([]);
    for (const hook of ['toolbar', 'page_attachments', 'help', 'contextual_links_view_alter']) {
      expect(handler.hasImplementations(hook, MODULE_NAME)).toBe(true);
    }
  });

  it('invokes help through the handler', () => {
    const handler = setup([]);
    const out = handler.invoke(MODULE_NAME, 'help', ['help.page.contextual']);
    expect(out).toContain('About');
  });

  it('drives page_attachments through the handler with permission', () => {
    const handler = setup(['access contextual links']);
    const page: RenderArray = {};
    handler.invokeAllWith('page_attachments', (listener) => listener(page));
    const attached = page['#attached'] as { library?: string[] };
    expect(attached.library).toContain('contextual/drupal.contextual-links');
  });
});
