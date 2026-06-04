import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerViewsHooks, viewsHelp } from './hooks.js';

describe('views hook implementations', () => {
  it('viewsHelp returns help text for the views help route', () => {
    expect(viewsHelp('help.page.views')).toContain('Views');
    expect(viewsHelp('some.other.route')).toBe('');
  });

  it('registerViewsHooks wires hook_help into a ModuleHandler under "views"', () => {
    const mh = new ModuleHandler();
    mh.setModuleList({ views: { name: 'views' } });
    registerViewsHooks(mh);

    expect(mh.hasImplementations('help', 'views')).toBe(true);
    const result = mh.invoke('views', 'help', ['help.page.views']);
    expect(result).toContain('Views');
  });
});
