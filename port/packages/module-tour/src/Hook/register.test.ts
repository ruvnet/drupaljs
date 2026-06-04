import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import { registerTourHooks, MODULE_NAME } from './register.js';
import { TourHooks } from './TourHooks.js';
import { TourManager } from '../TourManager.js';
import { Tour } from '../Entity/Tour.js';
import type { AccountLike, RenderArray, RouteMatchLike, TourStorageLike } from '../contracts.js';

function account(perms: string[]): AccountLike {
  return { hasPermission: (p: string) => perms.includes(p) };
}
function routeMatch(name: string | null): RouteMatchLike {
  return { getRouteName: () => name };
}
function storage(tours: Tour[]): TourStorageLike {
  const map: Record<string, Tour> = {};
  for (const t of tours) map[t.id()] = t;
  return { loadMultiple: () => map };
}

const tour = new Tour({
  id: 't',
  label: 'T',
  module: 'm',
  routes: [{ route_name: 'foo' }],
  tips: { x: { id: 'x', plugin: 'text', label: 'X', body: 'b' } },
});

function setup(perms: string[], route: string | null) {
  const handler = new ModuleHandler();
  handler.setModuleList({ [MODULE_NAME]: { name: MODULE_NAME } });
  const mgr = new TourManager(storage([tour]), account(perms));
  registerTourHooks(handler, new TourHooks(mgr, routeMatch(route)));
  return handler;
}

describe('registerTourHooks', () => {
  it('registers the tour hooks on the module handler', () => {
    const handler = setup(['access tour'], 'foo');
    for (const hook of ['help', 'page_attachments']) {
      expect(handler.hasImplementations(hook, MODULE_NAME)).toBe(true);
    }
  });

  it('invokes help through the handler', () => {
    const handler = setup([], 'foo');
    expect(handler.invoke(MODULE_NAME, 'help', ['help.page.tour'])).toContain('About');
  });

  it('drives page_attachments through the handler', () => {
    const handler = setup(['access tour'], 'foo');
    const page: RenderArray = {};
    handler.invokeAllWith('page_attachments', (listener) => listener(page));
    const attached = page['#attached'] as { library?: string[] };
    expect(attached.library).toContain('tour/tour');
  });
});
