import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { dynamicPageCacheHelp, registerDynamicPageCacheHooks } from './hooks.js';

describe('dynamicPageCacheHelp', () => {
  it('returns About/Uses help markup for the module help route', () => {
    const help = dynamicPageCacheHelp('help.page.dynamic_page_cache');
    expect(help).toContain('About');
    expect(help).toContain('Internal Dynamic Page Cache');
  });

  it('returns null for unrelated routes (faithful to PHP ?string)', () => {
    expect(dynamicPageCacheHelp('some.other.route')).toBeNull();
  });
});

describe('registerDynamicPageCacheHooks', () => {
  it('registers hook_help on the ModuleHandler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ dynamic_page_cache: { name: 'dynamic_page_cache' } });
    registerDynamicPageCacheHooks(handler);
    expect(handler.hasImplementations('help', 'dynamic_page_cache')).toBe(true);
  });

  it('the registered help hook is invokable through the handler', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ dynamic_page_cache: { name: 'dynamic_page_cache' } });
    registerDynamicPageCacheHooks(handler);
    const result = handler.invoke('dynamic_page_cache', 'help', [
      'help.page.dynamic_page_cache',
    ]);
    expect(result).toContain('About');
  });
});
